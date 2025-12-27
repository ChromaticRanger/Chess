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
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 0.5rem;
}

.annotation-editor {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 400px;
  overflow: hidden;
}

.editor-header {
  background-color: #2563eb;
  color: white;
  padding: 1rem;
}

.editor-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.move-info {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0;
}

.editor-body {
  padding: 1rem;
  position: relative;
}

.note-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: none;
  font-family: inherit;
}

.note-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

.note-textarea::placeholder {
  color: #9ca3af;
}

.char-count {
  position: absolute;
  bottom: 1.5rem;
  right: 1.75rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
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
  background-color: white;
  border: 1px solid #d1d5db;
  color: #374151;
}

.btn-cancel:hover {
  background-color: #f3f4f6;
}

.btn-save {
  background-color: #2563eb;
  border: 1px solid #2563eb;
  color: white;
}

.btn-save:hover {
  background-color: #1d4ed8;
}
</style>
