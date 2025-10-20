<template>
  <q-dialog v-model="isOpen" persistent maximized>
    <q-card class="edit-media-card">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <div class="text-h6">Edit Media</div>
            <div class="text-caption text-grey-6">{{ props.item.originalFileName }}</div>
          </div>
          <div class="header-right">
            <q-btn
              icon="close"
              flat
              round
              dense
              color="white"
              @click="handleClose"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Content -->
      <q-card-section class="edit-container">
        <!-- Media Preview Section with Flag Marking -->
        <div class="media-preview-section">
          <div class="preview-container" ref="mediaContainer">
            <!-- Loading State -->
            <div v-if="isLoading" class="preview-loading">
              <q-spinner-dots size="50px" color="primary" />
              <div class="text-caption q-mt-md">Loading media...</div>
            </div>

            <!-- Image Preview with Flag Marking -->
            <div v-else-if="isImage" class="image-preview-wrapper" ref="imageContainer">
              <img
                ref="mediaElement"
                :src="props.item.fileUrl"
                :alt="props.item.originalFileName"
                class="preview-image"
                @load="handleImageLoad"
                @error="handleImageError"
                @click="handleMediaClick"
                style="display: block;"
              />

              <!-- Flag Markers for Images -->
              <div
                v-for="flag in allFlags"
                :key="flag.id"
                class="flag-marker"
                :style="getImageFlagStyle(flag)"
                @click="openFlagNotes(flag)"
              >
                <q-icon 
                  :name="'flag'"
                  :color="flag.type"
                  size="24px"
                  class="flag-icon clickable"
                />
              </div>
            </div>

            <!-- Video Preview with Flag Marking -->
            <div v-else-if="isVideo" class="video-preview-wrapper" ref="videoContainer">
              <video
                ref="mediaElement"
                :src="props.item.fileUrl"
                class="preview-video"
                controls
                @loadedmetadata="handleVideoLoaded"
                @timeupdate="handleTimeUpdate"
                @click="handleVideoClick"
              ></video>

              <!-- Flag Markers for Videos -->
              <div
                v-for="flag in allFlags"
                :key="flag.id"
                class="flag-marker"
                :style="getVideoFlagStyle(flag)"
                @click="openFlagNotes(flag)"
                v-show="shouldShowVideoFlag(flag)"
              >
                <q-icon 
                  :name="'flag'"
                  :color="flag.type"
                  size="24px"
                  class="flag-icon clickable"
                />
              </div>

              <!-- Video Timeline with Flag Markers (for videos) -->
              <div v-if="isVideo && videoDuration > 0" class="video-timeline">
                <div class="timeline-container" ref="timelineContainer">
                  <div class="timeline-bar" @click="seekToTime">
                    <div class="timeline-progress" :style="{ width: `${playbackProgress}%` }"></div>
                    
                    <!-- Flag markers on timeline -->
                    <div
                      v-for="flag in allFlags"
                      :key="`timeline-${flag.id}`"
                      class="timeline-flag"
                      :style="{ left: `${(flag.timestamp / videoDuration) * 100}%` }"
                      @click.stop="seekToFlag(flag)"
                    >
                      <q-icon 
                        :name="'flag'"
                        :color="flag.type"
                        size="12px"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Other file types -->
            <div v-else class="file-preview">
              <q-icon :name="getFileIcon()" size="64px" color="grey-6" />
              <div class="text-caption q-mt-sm">{{ props.item.originalFileName }}</div>
              <div class="text-caption text-grey-6">{{ formatFileSize(props.item.fileSize) }}</div>
            </div>

            <!-- Flag Speed Dial -->
            <q-fab
              v-if="showFlagSpeedDial"
              v-model="showFlagSpeedDial"
              icon="flag"
              direction="up"
              color="primary"
              :style="{ 
                position: 'absolute', 
                left: `${speedDialPosition.x}px`, 
                top: `${speedDialPosition.y}px`,
                zIndex: 1000
              }"
              padding="sm"
              @hide="hideFlagSpeedDial"
            >
              <q-fab-action
                color="red"
                icon="flag"
                label="Red Flag"
                @click="addFlag('red')"
              />
              <q-fab-action
                color="yellow"
                icon="flag"
                label="Yellow Flag"
                @click="addFlag('yellow')"
              />
              <q-fab-action
                color="green"
                icon="flag"
                label="Green Flag"
                @click="addFlag('green')"
              />
              <q-fab-action
                color="grey"
                icon="flag"
                label="Others"
                @click="addFlag('grey')"
              />
            </q-fab>
          </div>

          <!-- File Info Card -->
          <div class="file-info-card">
            <q-card-section class="q-pa-md">
              <div class="file-info-grid">
                <div class="info-item">
                  <q-icon name="info" class="q-mr-sm" />
                  <div class="info-label">Type:</div>
                  <div class="info-value">{{ props.item.mediaType }}</div>
                </div>
                <div class="info-item">
                  <q-icon name="folder" class="q-mr-sm" />
                  <div class="info-label">Size:</div>
                  <div class="info-value">{{ formatFileSize(props.item.fileSize) }}</div>
                </div>
                <div class="info-item">
                  <q-icon name="schedule" class="q-mr-sm" />
                  <div class="info-label">Uploaded:</div>
                  <div class="info-value">{{ formatDate(props.item.createdAt) }}</div>
                </div>
                <div class="info-item">
                  <q-icon name="person" class="q-mr-sm" />
                  <div class="info-label">By:</div>
                  <div class="info-value">{{ props.item.createdBy || 'Unknown' }}</div>
                </div>
              </div>
            </q-card-section>
          </div>
        </div>

        <!-- Form Section -->
        <div class="edit-form-section">
          <q-form @submit="handleSubmit" class="edit-form">
            <!-- Basic Information -->
            <div class="form-section">
              <q-input
                v-model="formData.title"
                label="Title"
                outlined
                class="q-mb-md"
                :rules="[val => !!val || 'Title is required']"
              >
                <template v-slot:prepend>
                  <q-icon name="title" />
                </template>
              </q-input>

              <q-input
                v-model="formData.description"
                label="Description"
                type="textarea"
                outlined
                rows="3"
                class="q-mb-md"
              >
                <template v-slot:prepend>
                  <q-icon name="description" />
                </template>
              </q-input>

              <q-input
                v-model="formData.caption"
                label="Caption"
                outlined
                class="q-mb-md"
              >
                <template v-slot:prepend>
                  <q-icon name="short_text" />
                </template>
              </q-input>
            </div>

            <!-- Visibility Settings -->
            <div class="form-section">
              <div class="section-title">
                <q-icon name="visibility" class="q-mr-sm" />
                <span>Visibility</span>
              </div>

              <div class="visibility-options">
                <q-radio
                  v-model="formData.isPublic"
                  :val="true"
                  label="Public"
                  color="positive"
                  class="visibility-option"
                />
                <q-radio
                  v-model="formData.isPublic"
                  :val="false"
                  label="Private"
                  color="warning"
                  class="visibility-option"
                />
              </div>

              <div class="visibility-description">
                <q-icon 
                  :name="formData.isPublic ? 'public' : 'lock'"
                  :color="formData.isPublic ? 'positive' : 'warning'"
                  size="16px"
                  class="q-mr-xs"
                />
                <span class="text-caption">
                  {{ formData.isPublic
                      ? 'This file can be viewed by anyone with access to the project'
                      : 'This file is only visible to project members'
                  }}
                </span>
              </div>
            </div>

            <!-- Sort Order -->
            <div class="form-section">
              <q-input
                v-model.number="formData.sortOrder"
                label="Sort Order"
                type="number"
                outlined
                min="0"
                step="1"
                class="q-mb-md"
                hint="Lower numbers appear first"
              >
                <template v-slot:prepend>
                  <q-icon name="sort" />
                </template>
              </q-input>
            </div>

            <!-- Metadata (Advanced) -->
            <div class="form-section">
              <q-expansion-item
                icon="settings"
                label="Advanced Settings"
                header-class="text-primary"
              >
                <!-- Custom Metadata -->
                <div class="metadata-section">
                  <div class="section-title">
                    <q-icon name="code" class="q-mr-sm" />
                    <span>Custom Metadata</span>
                  </div>

                  <div class="metadata-editor">
                    <div
                      v-for="(meta, index) in metadataItems"
                      :key="index"
                      class="metadata-item"
                    >
                      <q-input
                        v-model="meta.key"
                        label="Key"
                        outlined
                        dense
                        class="metadata-key"
                      />
                      <q-input
                        v-model="meta.value"
                        label="Value"
                        outlined
                        dense
                        class="metadata-value"
                      />
                      <q-btn
                        icon="remove"
                        flat
                        round
                        dense
                        color="negative"
                        @click="removeMetadataItem(index)"
                        class="metadata-remove"
                      />
                    </div>

                    <q-btn
                      icon="add"
                      label="Add Metadata"
                      flat
                      color="primary"
                      @click="addMetadataItem"
                      class="q-mt-sm"
                    />
                  </div>
                </div>

                <!-- File Actions -->
                <div class="file-actions-section">
                  <div class="section-title">
                    <q-icon name="file_download" class="q-mr-sm" />
                    <span>File Actions</span>
                  </div>

                  <div class="action-buttons">
                    <q-btn
                      icon="file_download"
                      label="Download"
                      color="primary"
                      flat
                      @click="downloadFile"
                      class="q-mb-sm"
                    />

                    <q-btn
                      icon="open_in_new"
                      label="Open in New Tab"
                      color="primary"
                      flat
                      @click="openInNewTab"
                      class="q-mb-sm"
                    />

                    <q-btn
                      icon="link"
                      label="Copy Link"
                      color="info"
                      flat
                      @click="copyFileUrl"
                      class="q-mb-sm"
                    />
                  </div>
                </div>
              </q-expansion-item>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
              <q-btn
                label="Cancel"
                flat
                @click="handleClose"
                class="q-mr-sm"
              />
              <q-btn
                label="Save Changes"
                type="submit"
                color="primary"
                :loading="isSaving"
                :disable="!hasChanges"
              />
            </div>
          </q-form>
        </div>
      </q-card-section>
    </q-card>

    <!-- Flag Notes Modal -->
    <q-dialog v-model="showFlagNotesModal" persistent>
      <q-card style="min-width: 400px; max-width: 600px;">
        <q-card-section>
          <div class="text-h6">
            {{ formatFlagType(selectedFlag?.type) }} Flag Notes
          </div>
          <div class="text-caption text-grey-6">
            <span v-if="isVideo && selectedFlag?.timestamp !== undefined">
              At {{ formatTime(selectedFlag.timestamp) }}
            </span>
            <span v-else-if="selectedFlag?.createdBy">
              Added by {{ selectedFlag.createdBy }}
            </span>
            <span v-else>Flag Note</span>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 400px" class="scroll">
          <NoteEditor
            v-if="showFlagNotesModal && selectedFlag"
            :users="projectUsers"
            v-model="flagNoteData"
            @save-note="handleFlagNoteSave"
            @cancel-note="closeFlagNotes"
          />
        </q-card-section>

        <!-- ENHANCED: Add "View Existing Notes" button to existing actions -->
        <q-card-actions align="between">
          <q-btn
            label="View Existing Notes"
            flat
            color="info"
            icon="list"
            @click="showExistingFlagNotes"
            :disable="isLoadingFlagNotes"
          >
            <q-badge v-if="flagNotes.length > 0" color="primary" floating>
              {{ flagNotes.length }}
            </q-badge>
          </q-btn>
          
          <div>
            <q-btn
              label="Cancel"
              flat
              @click="closeFlagNotes"
            />
            <q-btn
              label="Save Note"
              color="primary"
              @click="handleFlagNoteSave(flagNoteData)"
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- NEW: Existing Flag Notes List Modal -->
    <q-dialog v-model="showFlagNotesList" persistent>
      <q-card style="min-width: 500px; max-width: 800px; max-height: 80vh;">
        <q-card-section>
          <div class="text-h6">
            {{ formatFlagType(selectedFlag?.type) }} Flag - Existing Notes
          </div>
          <div class="text-caption text-grey-6">
            <span v-if="isVideo && selectedFlag?.timestamp !== undefined">
              At {{ formatTime(selectedFlag.timestamp) }}
            </span>
            <span v-else>Flag Notes</span>
            <span class="q-ml-sm">({{ flagNotes.length }} notes found)</span>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 60vh" class="scroll">
          <!-- Loading State -->
          <div v-if="isLoadingFlagNotes" class="text-center q-pa-md">
            <q-spinner color="primary" size="3em" />
            <div class="q-mt-sm text-grey-6">Loading flag notes...</div>
          </div>

          <!-- No Notes Found -->
          <div v-else-if="flagNotes.length === 0" class="text-center q-pa-md">
            <q-icon name="note_alt" size="3em" color="grey-5" />
            <div class="q-mt-sm text-grey-6">No notes found for this flag</div>
          </div>

          <!-- Notes List -->
          <div v-else class="notes-list">
            <div 
              v-for="(note, index) in flagNotes" 
              :key="note.recCode || index"
              class="note-item q-mb-md"
            >
              <q-card flat bordered>
                <q-card-section>
                  <!-- Note Header -->
                  <div class="note-header row items-center q-mb-sm">
                    <div class="col">
                      <div class="text-weight-medium">
                        {{ note.subject || 'Untitled Note' }}
                      </div>
                      <div class="text-caption text-grey-6">
                        By {{ getNoteAuthorName(note) }} • {{ formatNoteDate(note.insertDate || note.createdAt) }}
                      </div>
                    </div>
                    <div class="col-auto">
                      <q-badge 
                        v-if="note.isImportant" 
                        color="orange" 
                        icon="star" 
                        label="Important"
                        class="q-mr-xs"
                      />
                      <q-badge 
                        v-if="note.isPrivate" 
                        color="grey" 
                        icon="lock" 
                        label="Private"
                      />
                    </div>
                  </div>
                  
                  <!-- Note Content -->
                  <div class="note-content">
                    <div v-html="note.noteContent || note.content" class="note-text"></div>
                  </div>
                  
                  <!-- Note Mentions -->
                  <div v-if="note.mentions && note.mentions.length > 0" class="note-mentions q-mt-sm">
                    <div class="text-caption text-grey-6 q-mb-xs">Mentions:</div>
                    <q-chip
                      v-for="mention in note.mentions"
                      :key="mention.userId"
                      size="sm"
                      color="blue-grey-2"
                      text-color="blue-grey-8"
                      icon="person"
                    >
                      {{ mention.name }}
                    </q-chip>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            label="Close"
            flat
            @click="closeFlagNotesList"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
// import { useGalleryStore } from 'stores/gallery'
import { GALLERY_MEDIA_TYPES, getGalleryFileIcon } from 'src/utils/file'
import { showError, showSuccess } from 'src/utils/notification'
import { getCurrentUserId } from 'src/utils/auth'
import NoteEditor from './NoteEditor.vue'
import noteService from 'src/services/api/note.service'
import galleryService from 'src/services/api/gallery.service'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: () => ({})
  },
  projectUsers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'saved', 'close'])

// Store
// const galleryStore = useGalleryStore()

// Refs - Media elements
const mediaElement = ref(null)
const imageContainer = ref(null)
const videoContainer = ref(null)
const timelineContainer = ref(null)
const mediaContainer = ref(null)

// State - Dialog
const isOpen = ref(false)
const isLoading = ref(true)
const isSaving = ref(false)

// State - Form data
const formData = ref({
  title: '',
  description: '',
  caption: '',
  isPublic: true,
  sortOrder: 0,
  flags: []
})
const originalData = ref({})
const metadataItems = ref([])

// State - Flag marking
const showFlagSpeedDial = ref(false)
const speedDialPosition = ref({ x: 0, y: 0 })
const showFlagNotesModal = ref(false)
const selectedFlag = ref(null)

// NEW: Enhanced flag notes data (ADDED - preserves all existing functionality)
const flagNotes = ref([]) // Store notes for selected flag
const showFlagNotesList = ref(false) // Show notes list dialog
const isLoadingFlagNotes = ref(false) // Loading state

// Update the existing flagNoteData structure to match MediaViewer.vue:
const flagNoteData = ref({
  subject: '',
  noteContent: '',
  mentions: []
})

// State - Video
const videoDuration = ref(0)
const currentTime = ref(0)
const playbackProgress = ref(0)

// Computed
const isImage = computed(() => props.item.mediaType === GALLERY_MEDIA_TYPES.IMAGE)
const isVideo = computed(() => props.item.mediaType === GALLERY_MEDIA_TYPES.VIDEO)

const allFlags = computed(() => formData.value.flags || [])

const hasChanges = computed(() => {
  if (!originalData.value) return false
  
  return (
    formData.value.title !== originalData.value.title ||
    formData.value.description !== originalData.value.description ||
    formData.value.caption !== originalData.value.caption ||
    formData.value.isPublic !== originalData.value.isPublic ||
    formData.value.sortOrder !== originalData.value.sortOrder ||
    JSON.stringify(formData.value.flags) !== JSON.stringify(originalData.value.flags) ||
    JSON.stringify(metadataItems.value) !== JSON.stringify(getOriginalMetadataItems())
  )
})

// NEW: Load notes by flagId function (ADDED - preserves all existing)
const loadFlagNotes = async (flagId) => {
  if (!flagId) return
  
  isLoadingFlagNotes.value = true
  try {
    // Get all notes and filter by flagId
    const response = await noteService.getNodeNotes(props.item.nodeId || props.item.recCode)
    
    if (response.success && response.data) {
      // Filter notes that have the matching flagId
      const notesWithFlagId = response.data.content || response.data
      flagNotes.value = Array.isArray(notesWithFlagId) 
        ? notesWithFlagId.filter(note => note.flagId === flagId)
        : []
    } else {
      flagNotes.value = []
    }
  } catch (error) {
    console.error('Failed to load flag notes:', error)
    flagNotes.value = []
    showError('Failed to load flag notes')
  } finally {
    isLoadingFlagNotes.value = false
  }
}

// NEW: Show existing notes list (ADDED - preserves all existing)
const showExistingFlagNotes = () => {
  showFlagNotesList.value = true
}

// NEW: Close notes list (ADDED - preserves all existing)
const closeFlagNotesList = () => {
  showFlagNotesList.value = false
  flagNotes.value = []
}

// NEW: Format note display date (ADDED - preserves all existing)
const formatNoteDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// NEW: Get note author name (ADDED - preserves all existing)
const getNoteAuthorName = (note) => {
  if (note.authorName) return note.authorName
  if (note.userId) {
    const user = props.projectUsers.find(u => u.recCode === note.userId)
    return user ? user.name : 'Unknown User'
  }
  return 'Unknown User'
}

// Initialize form
const initializeForm = () => {
  if (!props.item) return

  formData.value = {
    title: props.item.title || '',
    description: props.item.description || '',
    caption: props.item.caption || '',
    isPublic: props.item.isPublic !== undefined ? props.item.isPublic : true,
    sortOrder: props.item.sortOrder || 0,
    flags: props.item.metadata?.flags || []
  }

  originalData.value = { ...formData.value, flags: [...(formData.value.flags || [])] }

  // Initialize metadata items (excluding flags)
  if (props.item.metadata && typeof props.item.metadata === 'object') {
    metadataItems.value = Object.entries(props.item.metadata)
      .filter(([key]) => key !== 'flags')
      .map(([key, value]) => ({
        key,
        value: String(value)
      }))
  } else {
    metadataItems.value = []
  }

  isLoading.value = false
  console.log('Form initialized with flags:', formData.value.flags)
}

const getOriginalMetadataItems = () => {
  if (props.item.metadata && typeof props.item.metadata === 'object') {
    return Object.entries(props.item.metadata)
      .filter(([key]) => key !== 'flags')
      .map(([key, value]) => ({
        key,
        value: String(value)
      }))
  }
  return []
}

// Flag marking methods
const handleMediaClick = (event) => {
  if (!isImage.value && !isVideo.value) return
  
  const container = isImage.value ? imageContainer.value : videoContainer.value
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  
  // Get click position relative to container
  const clickX = event.clientX - containerRect.left
  const clickY = event.clientY - containerRect.top

  // Show speed dial at click position
  speedDialPosition.value = { x: clickX, y: clickY }
  showFlagSpeedDial.value = true
}

const hideFlagSpeedDial = () => {
  showFlagSpeedDial.value = false
}

const addFlag = (type) => {
  if (!getCurrentUserId()) {
    showError('User not authenticated')
    return
  }

  const container = isImage.value ? imageContainer.value : videoContainer.value
  if (!container) return

  const containerRect = container.getBoundingClientRect()
  
  // Calculate relative position (0-1 scale)
  const relativeX = speedDialPosition.value.x / containerRect.width
  const relativeY = speedDialPosition.value.y / containerRect.height

  const newFlag = {
    id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    note: '',
    type: type,
    userId: getCurrentUserId(),
    position: {
      x: relativeX,
      y: relativeY
    },
    createdAt: new Date().toISOString()
  }

  // Add timestamp for videos
  if (isVideo.value && mediaElement.value) {
    newFlag.timestamp = mediaElement.value.currentTime || 0
  }

  // Add to existing flags array
  formData.value.flags.push(newFlag)
  
  hideFlagSpeedDial()
  showSuccess(`${formatFlagType(type)} flag added`)
  
  console.log('Flag added:', newFlag)
  console.log('Current flags:', formData.value.flags)
}

// REPLACE the existing openFlagNotes function with this enhanced version:
const openFlagNotes = async (flag) => {
  selectedFlag.value = flag
  flagNoteData.value = {
    subject: `${formatFlagType(flag.type)} Flag Note`,
    noteContent: flag.note || '',
    mentions: []
  }
  showFlagNotesModal.value = true
  
  if (mediaElement.value && !mediaElement.value.paused && isVideo.value) {
    mediaElement.value.pause()
  }

  // NEW: Load existing notes for this flag
  await loadFlagNotes(flag.id)
}

// UPDATE the existing closeFlagNotes function:
const closeFlagNotes = () => {
  showFlagNotesModal.value = false
  selectedFlag.value = null
  flagNoteData.value = {
    subject: '',
    noteContent: '',
    mentions: []
  }
}

// REPLACE the existing saveFlagNote function with this enhanced version:
const handleFlagNoteSave = async (noteData) => {
  try {
    if (!selectedFlag.value || !props.item) return

    // Get current user ID
    const currentUserId = getCurrentUserId()
    if (!currentUserId) {
      showError('User not authenticated')
      return
    }

    // Process note data for backend compatibility, including required nodeId
    const apiNoteData = noteService.processNoteForBackend({
      ...noteData,
      nodeId: props.item.nodeId || props.item.recCode,  // Required by API
      nodeGalleryId: props.item.recCode,                 // For gallery items
      flagId: selectedFlag.value.id,                     // Link to flag
      userId: currentUserId
    })

    console.log('Saving flag note with data:', apiNoteData)

    // Save the note
    const response = await noteService.createNote(apiNoteData)
    
    if (response.success) {
      showSuccess('Flag note saved successfully')
      
      // Update the flag's note property with the basic note content
      const flagIndex = formData.value.flags.findIndex(f => f.id === selectedFlag.value.id)
      if (flagIndex !== -1) {
        formData.value.flags[flagIndex].note = noteData.noteContent
      }
      
      // Reload flag notes to show the new one
      await loadFlagNotes(selectedFlag.value.id)
      
      // Close the modal
      closeFlagNotes()
    } else {
      showError(response.message || 'Failed to save flag note')
    }
  } catch (error) {
    console.error('Error saving flag note:', error)
    showError('Failed to save flag note')
  }
}

// Flag positioning methods
const getImageFlagStyle = (flag) => {
  if (!flag.position || !imageContainer.value) {
    return { display: 'none' }
  }

  const container = imageContainer.value
  const containerRect = container.getBoundingClientRect()
  const img = container.querySelector('.preview-image')
  
  if (!img) {
    return { display: 'none' }
  }

  const imgRect = img.getBoundingClientRect()
  const containerOffsetX = imgRect.left - containerRect.left
  const containerOffsetY = imgRect.top - containerRect.top

  const displayX = (flag.position.x * imgRect.width) + containerOffsetX
  const displayY = (flag.position.y * imgRect.height) + containerOffsetY

  return {
    position: 'absolute',
    left: `${displayX}px`,
    top: `${displayY}px`,
    zIndex: 999,
    pointerEvents: 'auto'
  }
}

const getVideoFlagStyle = (flag) => {
  if (!flag.position || !videoContainer.value || !mediaElement.value) {
    return { display: 'none' }
  }

  const container = videoContainer.value
  const video = mediaElement.value
  
  if (!video.videoWidth || !video.videoHeight) {
    return { display: 'none' }
  }

  const containerRect = container.getBoundingClientRect()
  const videoAspectRatio = video.videoWidth / video.videoHeight
  const containerAspectRatio = containerRect.width / containerRect.height
  
  let videoDisplayWidth, videoDisplayHeight
  let offsetX = 0, offsetY = 0
  
  if (videoAspectRatio > containerAspectRatio) {
    videoDisplayWidth = containerRect.width
    videoDisplayHeight = containerRect.width / videoAspectRatio
    offsetY = (containerRect.height - videoDisplayHeight) / 2
  } else {
    videoDisplayHeight = containerRect.height
    videoDisplayWidth = containerRect.height * videoAspectRatio
    offsetX = (containerRect.width - videoDisplayWidth) / 2
  }
  
  const displayX = (flag.position.x * videoDisplayWidth) + offsetX
  const displayY = (flag.position.y * videoDisplayHeight) + offsetY

  return {
    position: 'absolute',
    left: `${displayX}px`,
    top: `${displayY}px`,
    zIndex: 999,
    pointerEvents: 'auto'
  }
}

const shouldShowVideoFlag = (flag) => {
  if (!isVideo.value || flag.timestamp === undefined || flag.timestamp === null) {
    return true // Show flags without timestamp (like image flags)
  }
  
  const tolerance = 0.5
  return Math.abs(currentTime.value - flag.timestamp) <= tolerance
}

// Video methods
const handleVideoLoaded = () => {
  if (mediaElement.value) {
    videoDuration.value = mediaElement.value.duration
  }
}

const handleTimeUpdate = () => {
  if (mediaElement.value) {
    currentTime.value = mediaElement.value.currentTime
    playbackProgress.value = (currentTime.value / videoDuration.value) * 100
  }
}

const handleVideoClick = (event) => {
  // Allow normal video controls, but also handle flag marking
  handleMediaClick(event)
}

const seekToTime = (event) => {
  if (!mediaElement.value || !timelineContainer.value) return

  const rect = timelineContainer.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const seekTime = percentage * videoDuration.value

  mediaElement.value.currentTime = seekTime
}

const seekToFlag = (flag) => {
  if (isVideo.value && mediaElement.value && flag.timestamp !== undefined) {
    mediaElement.value.currentTime = flag.timestamp
  }
}

// Image methods
const handleImageLoad = () => {
  console.log('Image loaded')
}

const handleImageError = () => {
  console.error('Failed to load image')
  showError('Failed to load image')
}

// Metadata methods
const addMetadataItem = () => {
  metadataItems.value.push({
    key: '',
    value: ''
  })
}

const removeMetadataItem = (index) => {
  metadataItems.value.splice(index, 1)
}

// Form methods
const handleSubmit = async () => {
  isSaving.value = true

  try {
    // Prepare metadata object
    const metadata = { ...props.item.metadata }
    
    // Add custom metadata items
    metadataItems.value.forEach(item => {
      if (item.key && item.value) {
        metadata[item.key] = item.value
      }
    })
    
    // Add flags to metadata
    metadata.flags = formData.value.flags

    // Prepare update data
    const updateData = {
      title: formData.value.title,
      description: formData.value.description,
      caption: formData.value.caption,
      isPublic: formData.value.isPublic,
      sortOrder: formData.value.sortOrder,
      metadata: metadata
    }

    console.log('Updating media with data:', updateData)

    // Update the media item
    await galleryService.updateMediaMetadata(props.item.recCode, metadata)
    showSuccess('Media updated successfully')
    emit('saved', updateData)
    handleClose()
    // if (response.success) {
    //   showSuccess('Media updated successfully')
    //   emit('saved', response.data)
    //   handleClose()
    // } else {
    //   showError(response.message || 'Failed to update media')
    // }
  } catch (error) {
    console.error('Error saving media:', error)
    showError('Failed to save media: ' + (error.response?.data?.message || error.message))
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  emit('close')
}

// File actions
const downloadFile = () => {
  const link = document.createElement('a')
  link.href = props.item.fileUrl
  link.download = props.item.originalFileName || props.item.fileName
  link.click()
}

const openInNewTab = () => {
  window.open(props.item.fileUrl, '_blank')
}

const copyFileUrl = async () => {
  try {
    await navigator.clipboard.writeText(props.item.fileUrl)
    showSuccess('File URL copied to clipboard')
  } catch (error) {
    showError('Failed to copy URL' + error)
  }
}

// Utilities
const getFileIcon = () => {
  return getGalleryFileIcon(props.item.mediaType)
}

const formatFlagType = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    console.log('Dialog opened, initializing...')
    initializeForm()
    // Set loading to false immediately since we're just showing the image URL
    isLoading.value = false
  }
  isOpen.value = newValue
})

watch(() => isOpen.value, (newValue) => {
  emit('update:modelValue', newValue)
})

// Lifecycle
onMounted(() => {
  if (props.modelValue) {
    console.log('Component mounted with dialog open')
    initializeForm()
    // Set loading to false immediately
    isLoading.value = false
    isOpen.value = true
  }
})
</script>

<style lang="scss" scoped>
.edit-media-card {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
  padding: 24px;
  flex-shrink: 0;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      display: flex;
      flex-direction: column;
    }
  }
}

.edit-container {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 0;
  overflow: hidden;
}

.media-preview-section {
  display: flex;
  flex-direction: column;
  border-right: 1px solid #e0e0e0;
  background: #fafafa;
  overflow: hidden;

  .preview-container {
    flex: 1;
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;

    .preview-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .image-preview-wrapper,
    .video-preview-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      .preview-image,
      .preview-video {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        cursor: pointer;
      }
    }

    .file-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    // Flag markers
    .flag-marker {
      position: absolute;
      transform: translate(-50%, -100%);
      cursor: pointer;
      z-index: 999;

      .flag-icon {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        transition: transform 0.2s ease;

        &:hover {
          transform: scale(1.1);
        }
      }

      &.clickable {
        cursor: pointer;
      }
    }

    // Video timeline
    .video-timeline {
      position: absolute;
      bottom: 20px;
      left: 20px;
      right: 20px;
      height: 40px;
      background: rgba(0, 0, 0, 0.7);
      border-radius: 20px;
      overflow: hidden;

      .timeline-container {
        position: relative;
        width: 100%;
        height: 100%;
        cursor: pointer;

        .timeline-bar {
          width: 100%;
          height: 100%;
          position: relative;
          background: rgba(255, 255, 255, 0.2);
        }

        .timeline-progress {
          height: 100%;
          background: #1976d2;
          transition: width 0.1s ease;
        }

        .timeline-flag {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          cursor: pointer;
          z-index: 1000;
        }
      }
    }
  }
}

.file-info-card {
  margin: 0 24px 0;
  background: white;
  border-radius: 0;
  border-top: 1px solid #e0e0e0;
  flex-shrink: 0;

  .file-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .info-label {
        font-weight: 500;
        color: #666;
        min-width: 60px;
      }

      .info-value {
        color: #333;
        word-break: break-all;
      }
    }
  }
}

.edit-form-section {
  padding: 24px;
  overflow-y: auto;
  background: white;
}

.edit-form {
  max-width: 500px;
}

.form-section {
  margin-bottom: 24px;

  .section-title {
    display: flex;
    align-items: center;
    font-weight: 500;
    margin-bottom: 16px;
    color: #424242;
  }
}

.visibility-options {
  display: flex;
  gap: 24px;
  padding: 12px 0;

  .visibility-option {
    flex: 1;
  }
}

.visibility-description {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-top: 8px;
}

.metadata-section {
  margin-top: 16px;

  .section-title {
    display: flex;
    align-items: center;
    font-weight: 500;
    margin-bottom: 16px;
    color: #424242;
  }

  .metadata-editor {
    .metadata-item {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 12px;
      align-items: center;
      margin-bottom: 12px;

      .metadata-key,
      .metadata-value {
        min-width: 0;
      }

      .metadata-remove {
        flex-shrink: 0;
      }
    }
  }
}

.file-actions-section {
  .section-title {
    display: flex;
    align-items: center;
    font-weight: 500;
    margin-bottom: 16px;
    color: #424242;
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .q-btn {
      justify-content: flex-start;
    }
  }
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
  margin-top: 24px;
  gap: 12px;
}

// Notes list styles
.notes-list {
  .note-item {
    .note-header {
      .text-weight-medium {
        font-size: 1rem;
        line-height: 1.4;
      }
    }

    .note-content {
      .note-text {
        font-size: 0.875rem;
        line-height: 1.5;
        color: #424242;
      }
    }

    .note-mentions {
      .q-chip {
        margin-right: 4px;
        margin-bottom: 4px;
      }
    }
  }
}

// Responsive design
@media (max-width: 1024px) {
  .edit-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr;
  }

  .media-preview-section {
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
    max-height: 50vh;
  }

  .preview-container {
    margin: 16px;
    min-height: 200px;

    .preview-image {
      max-height: 250px;
    }
  }

  .file-info-card {
    margin: 0 16px 16px;
  }

  .edit-form-section {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .dialog-header {
    padding: 16px;
  }

  .preview-container {
    margin: 12px;
    padding: 16px;
    min-height: 150px;

    .preview-image {
      max-height: 200px;
    }
  }

  .file-info-card {
    margin: 0 12px 12px;
    
    .file-info-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  .edit-form-section {
    padding: 12px;
  }

  .edit-form {
    max-width: none;
  }

  .metadata-item {
    grid-template-columns: 1fr;
    gap: 8px;

    .metadata-remove {
      justify-self: end;
    }
  }

  .visibility-options {
    flex-direction: column;
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .dialog-header {
    .header-content {
      .header-left {
        .text-h6 {
          font-size: 1.1rem;
        }
      }
    }
  }

  .form-actions {
    flex-direction: column;
    gap: 12px;

    .q-btn {
      width: 100%;
    }
  }
}

// Dark mode support
.body--dark {
  .media-preview-section {
    background: #2d2d2d;
    border-right-color: #424242;
  }

  .preview-container,
  .file-info-card {
    background: #424242;
    color: #e0e0e0;
  }

  .visibility-description {
    background: #616161;
    color: #e0e0e0;
  }

  .form-actions {
    border-top-color: #424242;
  }

  .edit-form-section {
    background: #2d2d2d;
  }
}

// Loading animation
.preview-container {
  .q-spinner-dots {
    opacity: 0.8;
  }
}

// Smooth transitions
.edit-container,
.preview-container,
.file-info-card {
  transition: all 0.3s ease;
}

.form-section {
  transition: margin-bottom 0.3s ease;
}

// Focus styles
.edit-form {
  .q-field--focused {
    .q-field__control {
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
    }
  }
}

// Flag speed dial animations
.q-fab {
  transition: all 0.3s ease;
}

// Flag marker animations
.flag-marker {
  animation: flagAppear 0.3s ease-out;
}

@keyframes flagAppear {
  from {
    opacity: 0;
    transform: translate(-50%, -100%) scale(0.5);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}
</style>