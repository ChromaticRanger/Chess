<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  moveIndex: {
    type: Number,
    required: true,
  },
  moveNumber: {
    type: Number,
    required: true,
  },
  moveNotation: {
    type: String,
    required: true,
  },
  moveColor: {
    type: String,
    default: "White",
  },
  existingNote: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["save", "close"]);

const note = ref("");
const maxLength = 200;

// Initialize note when editor opens or existingNote changes
watch(
  () => props.existingNote,
  (newNote) => {
    note.value = newNote || "";
  },
  { immediate: true }
);

// Reset note when editor becomes visible
watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      note.value = props.existingNote || "";
    }
  }
);

const handleSave = () => {
  emit("save", {
    moveIndex: props.moveIndex,
    annotation: note.value.trim(),
  });
};

const handleClose = () => {
  emit("close");
};
</script>

<template>
  <div v-if="visible" class="annotation-overlay">
    <div class="annotation-editor">
      <div class="editor-header">
        <h3 class="editor-title">Add note to move</h3>
        <p class="move-info">
          Move {{ moveNumber }}{{ moveColor === "Black" ? "..." : "." }}
          {{ moveNotation }}
        </p>
      </div>

      <div class="editor-body">
        <textarea
          v-model="note"
          :maxlength="maxLength"
          placeholder="Enter your note about this move..."
          class="note-textarea"
          rows="4"
        ></textarea>
        <div class="char-count">{{ note.length }}/{{ maxLength }}</div>
      </div>

      <div class="editor-actions">
        <button class="btn-cancel" @click="handleClose">Cancel</button>
        <button class="btn-save" @click="handleSave">Save</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.annotation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 0.5rem;
}

.annotation-editor {
  background-color: #1a2535;
  border: 1px solid rgba(210, 180, 110, 0.2);
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.editor-header {
  background: linear-gradient(180deg, #1e2a3a 0%, #19233a 100%);
  border-bottom: 1px solid rgba(210, 180, 110, 0.25);
  color: white;
  padding: 1rem;
}

.editor-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #d2b46e;
  margin: 0 0 0.25rem 0;
}

.move-info {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.editor-body {
  padding: 1rem;
  position: relative;
  background-color: #1a2535;
}

.note-textarea {
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: none;
  font-family: inherit;
  color: rgba(255, 255, 255, 0.9);
  box-sizing: border-box;
}

.note-textarea:focus {
  outline: none;
  border-color: rgba(210, 180, 110, 0.6);
  box-shadow: 0 0 0 2px rgba(210, 180, 110, 0.15);
}

.note-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.char-count {
  position: absolute;
  bottom: 1.5rem;
  right: 1.75rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: #141e2e;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.btn-cancel,
.btn-save {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s;
}

.btn-cancel {
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.7);
}

.btn-cancel:hover {
  background-color: rgba(255, 255, 255, 0.08);
}

.btn-save {
  background-color: #d2b46e;
  border: 1px solid #d2b46e;
  color: #1e2a3a;
  font-weight: 600;
}

.btn-save:hover {
  background-color: #c4a35f;
  border-color: #c4a35f;
}
</style>
