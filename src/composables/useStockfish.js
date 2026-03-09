import { ref, onUnmounted } from 'vue';

export function useStockfish() {
  const engine = ref(null);
  const isReady = ref(false);
  const isAnalyzing = ref(false);
  const currentEvaluation = ref(null);

  let messageHandler = null;
  let analysisId = 0; // Track which analysis request is active

  const initEngine = async () => {
    if (engine.value) return;

    try {
      // Use the single-threaded lite version (no CORS headers required)
      // Create a Web Worker from the stockfish script
      const workerUrl = new URL(
        '../../node_modules/stockfish/src/stockfish-17.1-lite-single-03e3232.js',
        import.meta.url
      );

      engine.value = new Worker(workerUrl, { type: 'module' });

      // Set up message listener for UCI protocol
      engine.value.onmessage = (e) => {
        const message = typeof e.data === 'string' ? e.data : e.data.toString();

        // Check for UCI ready signal
        if (message === 'uciok') {
          isReady.value = true;
        }

        // Forward to current message handler if set
        if (messageHandler) {
          messageHandler(message);
        }
      };

      engine.value.onerror = (error) => {
        console.error('Stockfish worker error:', error);
      };

      // Initialize UCI protocol
      engine.value.postMessage('uci');
    } catch (error) {
      console.error('Failed to initialize Stockfish:', error);
      throw error;
    }
  };

  const stopAnalysis = () => {
    if (engine.value) {
      engine.value.postMessage('stop');
      messageHandler = null;
      analysisId++; // Invalidate any pending results from previous analysis
    }
  };

  const analyzePosition = (fen, depth = 15) => {
    return new Promise((resolve) => {
      if (!engine.value || !isReady.value) {
        resolve(null);
        return;
      }

      // Stop any existing analysis before starting a new one
      stopAnalysis();

      // Increment analysis ID to track this specific request
      const currentAnalysisId = ++analysisId;

      isAnalyzing.value = true;
      let bestMove = null;
      let score = null;
      let scoreType = 'cp';
      let currentDepth = 0;

      // Set up message handler for this analysis
      messageHandler = (message) => {
        // Ignore messages if this analysis has been superseded
        if (currentAnalysisId !== analysisId) {
          return;
        }

        // Parse info lines for score
        if (message.startsWith('info') && message.includes('score')) {
          const depthMatch = message.match(/depth (\d+)/);
          if (depthMatch) {
            currentDepth = parseInt(depthMatch[1]);
          }

          const cpMatch = message.match(/score cp (-?\d+)/);
          const mateMatch = message.match(/score mate (-?\d+)/);

          if (mateMatch) {
            score = parseInt(mateMatch[1]);
            scoreType = 'mate';
          } else if (cpMatch) {
            score = parseInt(cpMatch[1]);
            scoreType = 'cp';
          }
        }

        // Parse bestmove to complete analysis
        if (message.startsWith('bestmove')) {
          // Double-check this is still the active analysis
          if (currentAnalysisId !== analysisId) {
            return;
          }

          const moveMatch = message.match(/bestmove (\S+)/);
          if (moveMatch) {
            bestMove = moveMatch[1];
          }

          // Clear handler
          messageHandler = null;
          isAnalyzing.value = false;

          // Stockfish returns score from the perspective of the side to move.
          // We want scores always from White's perspective, so invert if Black to move.
          const isBlackToMove = fen.split(' ')[1] === 'b';
          const adjustedScore = isBlackToMove ? -score : score;

          const evaluation = {
            score: adjustedScore,
            scoreType,
            bestMove,
            depth: currentDepth,
            fen
          };

          currentEvaluation.value = evaluation;
          resolve(evaluation);
        }
      };

      // Send position and start analysis
      engine.value.postMessage('ucinewgame');
      engine.value.postMessage(`position fen ${fen}`);
      engine.value.postMessage(`go depth ${depth}`);
    });
  };

  const terminate = () => {
    if (engine.value) {
      stopAnalysis();
      engine.value.terminate();
      engine.value = null;
      isReady.value = false;
    }
  };

  // Cleanup on unmount
  onUnmounted(() => {
    terminate();
  });

  return {
    initEngine,
    analyzePosition,
    stopAnalysis,
    terminate,
    isReady,
    isAnalyzing,
    currentEvaluation
  };
}
