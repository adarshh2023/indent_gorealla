<template>
  <q-dialog
    v-model="isOpen"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    class="camera-capture-dialog"
  >
    <q-card class="capture-dialog-card">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="photo_camera" size="24px" class="q-mr-sm" />
            <div>
              <div class="text-h6">Add Photo</div>
              <div class="text-caption text-grey-6">
                {{ getSourceDescription() }}
                <span v-if="flags.length > 0"> • {{ flags.length }} flag(s) added</span>
              </div>
            </div>
          </div>

          <div class="header-right">
            <q-btn
              icon="close"
              flat
              round
              dense
              v-close-popup
              @click="handleClose"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Main Content -->
      <q-card-section class="dialog-content">
        <div class="capture-container">
          <!-- Photo Preview Section -->
          <div class="photo-preview-section">
            <div class="preview-container" @click="handlePhotoClick" ref="imageWrapper">
              <img
                v-if="imageData?.dataUrl"
                :src="imageData.dataUrl"
                class="preview-image"
                alt="Captured photo"
                ref="previewImage"
                @load="handleImageLoad"
              />
              <div v-else class="preview-placeholder">
                <q-icon name="image" size="64px" color="grey-5" />
                <p class="text-grey-6 q-mt-md">No image to preview</p>
              </div>

              <!-- Flag Markers on Photo -->
              <div
                v-for="flag in flags"
                :key="flag.id"
                class="flag-marker-photo"
                :style="getPhotoFlagStyle(flag)"
                @click.stop="openFlagNotes(flag)"
              >
                <q-icon 
                  :name="'flag'"
                  :color="flag.type"
                  size="24px"
                  class="flag-icon clickable"
                />
              </div>

              <!-- Flag Speed Dial for Photos -->
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

              <!-- Tap instruction overlay -->
              <div v-if="!flags.length && imageData?.dataUrl" class="tap-instruction">
                <q-icon name="touch_app" size="24px" />
                <span>Tap anywhere to add flags</span>
              </div>
            </div>
          </div>

          <!-- Content Section -->
          <div class="content-section">
            <!-- Photo Info Card -->
            <q-card v-if="imageData" class="photo-info-card">
              <q-card-section>
                <div class="row items-center no-wrap">
                  <div class="col">
                    <div class="text-subtitle2">Photo Information</div>
                    <div class="text-caption text-grey-6">
                      Source: {{ getSourceDescription() }}
                    </div>
                  </div>
                  <div class="col-auto">
                    <q-btn
                      flat
                      round
                      icon="info"
                      size="sm"
                      color="primary"
                    >
                      <q-tooltip>
                        <div>
                          <div><strong>Source:</strong> {{ getSourceDescription() }}</div>
                          <div><strong>Captured:</strong> {{ formatDateTime(new Date()) }}</div>
                          <div v-if="getEstimatedFileSize(imageData.dataUrl)">
                            <strong>Size:</strong> ~{{ getEstimatedFileSize(imageData.dataUrl).kb }} KB
                          </div>
                        </div>
                      </q-tooltip>
                    </q-btn>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- Form Section -->
            <div class="form-section">
              <q-form @submit="handleSave" class="capture-form">
                <!-- Quick Action Chips -->
                <div class="quick-actions">
                  <div class="section-title">
                    <q-icon name="flash_on" class="q-mr-sm" />
                    Quick Setup
                  </div>
                  <div class="action-chips">
                    <q-chip
                      clickable
                      @click="applyQuickSettings('progress')"
                      color="primary"
                      text-color="white"
                      icon="timeline"
                    >
                      Progress Photo
                    </q-chip>
                    <q-chip
                      clickable
                      @click="applyQuickSettings('issue')"
                      color="negative"
                      text-color="white"
                      icon="report_problem"
                    >
                      Issue Found
                    </q-chip>
                    <q-chip
                      clickable
                      @click="applyQuickSettings('before')"
                      color="info"
                      text-color="white"
                      icon="schedule"
                    >
                      Before Work
                    </q-chip>
                    <q-chip
                      clickable
                      @click="applyQuickSettings('after')"
                      color="positive"
                      text-color="white"
                      icon="check_circle"
                    >
                      After Work
                    </q-chip>
                  </div>
                </div>

                <!-- Flags List -->
                <div class="flags-list" v-if="flags.length > 0">
                  <div class="section-title">
                    <q-icon name="flag" class="q-mr-sm" />
                    Flags ({{ flags.length }})
                  </div>
                  <div class="flag-items">
                    <q-list dense>
                      <q-item
                        v-for="flag in flags"
                        :key="flag.id"
                        class="flag-item"
                      >
                        <q-item-section avatar>
                          <q-icon :name="'flag'" :color="flag.type" />
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ formatFlagType(flag.type) }} Flag</q-item-label>
                          <q-item-label caption>
                            Position: {{ Math.round(flag.position.x * 100) }}%, {{ Math.round(flag.position.y * 100) }}%
                            <span v-if="flag.note"> • {{ flag.note.substring(0, 30) }}...</span>
                          </q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <div class="row">
                            <q-btn
                              icon="edit"
                              flat
                              round
                              dense
                              size="sm"
                              @click="openFlagNotes(flag)"
                              color="primary"
                            >
                              <q-tooltip>Edit Note</q-tooltip>
                            </q-btn>
                            <q-btn
                              icon="delete"
                              flat
                              round
                              dense
                              size="sm"
                              @click="removeFlag(flag.id)"
                              color="negative"
                            >
                              <q-tooltip>Remove Flag</q-tooltip>
                            </q-btn>
                          </div>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </div>
                </div>

                <!-- Title -->
                <div class="form-group">
                  <q-input
                    v-model="formData.title"
                    label="Title *"
                    placeholder="Enter a title for this photo..."
                    outlined
                    maxlength="100"
                    counter
                    :rules="[val => !!val.trim() || 'Title is required']"
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="title" />
                    </template>
                  </q-input>
                </div>

                <!-- Description -->
                <div class="form-group">
                  <q-input
                    v-model="formData.description"
                    label="Description"
                    placeholder="Add a description or notes about this photo..."
                    outlined
                    type="textarea"
                    rows="3"
                    counter
                    maxlength="500"
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="subject" />
                    </template>
                  </q-input>
                </div>

                <!-- Category -->
                <div class="form-group">
                  <q-select
                    v-model="formData.mediaCategory"
                    :options="categoryOptions"
                    label="Category"
                    outlined
                    emit-value
                    map-options
                    class="q-mb-md"
                  >
                    <template v-slot:prepend>
                      <q-icon name="folder" />
                    </template>
                  </q-select>
                </div>

                <!-- Tags -->
                <div class="form-group">
                  <q-input
                    v-model="tagsInput"
                    label="Tags"
                    placeholder="Add tags separated by commas..."
                    outlined
                    class="q-mb-md"
                    @blur="processTags"
                    @keyup.enter="processTags"
                  >
                    <template v-slot:prepend>
                      <q-icon name="local_offer" />
                    </template>
                  </q-input>
                  
                  <div v-if="formData.tags.length > 0" class="tags-display">
                    <q-chip
                      v-for="(tag, index) in formData.tags"
                      :key="tag"
                      removable
                      @remove="removeTag(index)"
                      color="primary"
                      text-color="white"
                      size="sm"
                    >
                      {{ tag }}
                    </q-chip>
                  </div>
                </div>

                <!-- Visibility -->
                <div class="form-group">
                  <div class="section-title">Visibility</div>
                  <div class="visibility-options">
                    <q-radio
                      v-model="formData.isPublic"
                      :val="true"
                      label="Public"
                      color="primary"
                    />
                    <q-radio
                      v-model="formData.isPublic"
                      :val="false"
                      label="Private"
                      color="primary"
                    />
                  </div>
                  <div class="visibility-description">
                    <q-icon
                      :name="formData.isPublic ? 'public' : 'lock'"
                      size="20px"
                      :color="formData.isPublic ? 'positive' : 'warning'"
                      class="q-mr-sm"
                    />
                    <span class="text-caption">
                      {{ formData.isPublic ? 'Visible to all team members' : 'Only visible to you and project admins' }}
                    </span>
                  </div>
                </div>

                <!-- Form Actions -->
                <div class="form-actions">
                  <q-btn
                    label="Retake"
                    icon="camera_alt"
                    flat
                    @click="handleRetake"
                  />
                  <q-btn
                    label="Cancel"
                    flat
                    @click="handleClose"
                  />
                  <q-btn
                    label="Save Photo"
                    type="submit"
                    color="primary"
                    icon="save"
                    :loading="isSaving"
                    :disable="!canSave"
                  />
                </div>
              </q-form>
            </div>
          </div>
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
          Add notes for this flag marker
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
    </q-card>
  </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useGalleryStore } from 'stores/gallery'
import { GALLERY_CATEGORIES } from 'src/utils/file'
import { showError, showSuccess } from 'src/utils/notification'
import NoteEditor from './NoteEditor.vue'
import { getCurrentUserId } from 'src/utils/auth'
import noteService from 'src/services/api/note.service' 


// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  imageData: {
    type: Object,
    required: true
  },
  nodeId: {
    type: String,
    required: true
  },
  // ADD THIS NEW PROP
  projectUsers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'saved',
  'close',
  'retake'
])

// Store
const galleryStore = useGalleryStore()

// Refs
const imageWrapper = ref(null)
const previewImage = ref(null)

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isSaving = ref(false)

// Flag functionality with fixed positioning
const flags = ref([])
const showFlagSpeedDial = ref(false)
const speedDialPosition = ref({ x: 0, y: 0 })
const showFlagNotesModal = ref(false)
const selectedFlag = ref(null)
const flagNoteData = ref({
  subject: '',
  noteContent: '',
  mentions: []
})

// Form data
const formData = ref({
  title: '',
  description: '',
  mediaCategory: GALLERY_CATEGORIES.PROGRESS,
  isPublic: true,
  sortOrder: 0,
  tags: []
})

const tagsInput = ref('')

// Options
const categoryOptions = [
  {
    label: 'Progress',
    value: GALLERY_CATEGORIES.PROGRESS,
    icon: 'timeline',
    color: 'primary',
    description: 'Construction progress photos'
  },
  {
    label: 'Issues',
    value: GALLERY_CATEGORIES.ISSUE,
    icon: 'report_problem',
    color: 'negative',
    description: 'Problems and defects'
  },
  {
    label: 'Before',
    value: GALLERY_CATEGORIES.BEFORE,
    icon: 'schedule',
    color: 'info',
    description: 'Before work starts'
  },
  {
    label: 'After',
    value: GALLERY_CATEGORIES.AFTER,
    icon: 'check_circle',
    color: 'positive',
    description: 'After work completion'
  },
  {
    label: 'Blueprint',
    value: GALLERY_CATEGORIES.BLUEPRINT,
    icon: 'architecture',
    color: 'secondary',
    description: 'Plans and blueprints'
  }
]

// Computed
const canSave = computed(() => {
  return formData.value.title.trim() && props.imageData?.dataUrl && !isSaving.value
})

// Fixed photo flag positioning methods
const handlePhotoClick = (event) => {
  if (!imageWrapper.value || !previewImage.value) return

  const wrapper = imageWrapper.value
  const img = previewImage.value
  
  const wrapperRect = wrapper.getBoundingClientRect()
  const imgRect = img.getBoundingClientRect()
  
  // Calculate click position relative to the actual image
  const clickX = event.clientX - imgRect.left
  const clickY = event.clientY - imgRect.top
  
  // Check if click is within image bounds
  if (clickX >= 0 && clickX <= imgRect.width && clickY >= 0 && clickY <= imgRect.height) {
    // Store position relative to wrapper for speed dial
    const wrapperX = event.clientX - wrapperRect.left
    const wrapperY = event.clientY - wrapperRect.top
    
    speedDialPosition.value = { x: wrapperX, y: wrapperY }
    showFlagSpeedDial.value = true
  }
}

const hideFlagSpeedDial = () => {
  showFlagSpeedDial.value = false
}

const addFlag = (type) => {
  if (!previewImage.value || !imageWrapper.value) return

  // Check if user is authenticated
  const currentUserId = getCurrentUserId()
  if (!currentUserId) {
    showError('User not authenticated')
    return
  }

  const wrapper = imageWrapper.value
  const img = previewImage.value
  
  const wrapperRect = wrapper.getBoundingClientRect()
  const imgRect = img.getBoundingClientRect()
  
  // Calculate relative position (0-1 scale) based on actual image dimensions
  const relativeX = (speedDialPosition.value.x - (imgRect.left - wrapperRect.left)) / imgRect.width
  const relativeY = (speedDialPosition.value.y - (imgRect.top - wrapperRect.top)) / imgRect.height

  // Ensure coordinates are within bounds
  if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) {
    showError('Please tap on the image to add a flag')
    hideFlagSpeedDial()
    return
  }

  const flag = {
    id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: type,
    position: {
      x: relativeX,
      y: relativeY
    },
    note: '',
    userId: currentUserId, // 🟢 NEW: Add current user ID
    createdAt: new Date().toISOString() // 🟢 NEW: Add creation timestamp
  }

  flags.value.push(flag)
  hideFlagSpeedDial()
  showSuccess(`${formatFlagType(type)} flag added`)
}

const getPhotoFlagStyle = (flag) => {
  if (!flag.position || !imageWrapper.value || !previewImage.value) {
    return { display: 'none' }
  }

  const wrapper = imageWrapper.value
  const img = previewImage.value
  
  const wrapperRect = wrapper.getBoundingClientRect()
  const imgRect = img.getBoundingClientRect()
  
  // Convert relative coordinates back to absolute for current display
  const displayX = (flag.position.x * imgRect.width) + (imgRect.left - wrapperRect.left)
  const displayY = (flag.position.y * imgRect.height) + (imgRect.top - wrapperRect.top)

  return {
    position: 'absolute',
    left: `${displayX}px`,
    top: `${displayY}px`,
    zIndex: 999
  }
}

const removeFlag = (flagId) => {
  const index = flags.value.findIndex(f => f.id === flagId)
  if (index > -1) {
    flags.value.splice(index, 1)
    showSuccess('Flag removed')
  }
}

const openFlagNotes = (flag) => {
  selectedFlag.value = flag
  flagNoteData.value = {
    subject: `${formatFlagType(flag.type)} Flag Note`,
    noteContent: flag.note || '',
    mentions: []
  }
  showFlagNotesModal.value = true
}

const closeFlagNotes = () => {
  showFlagNotesModal.value = false
  selectedFlag.value = null
  flagNoteData.value = {
    subject: '',
    noteContent: '',
    mentions: []
  }
}

const handleFlagNoteSave = (noteData) => {
  if (selectedFlag.value) {
    selectedFlag.value.note = noteData.noteContent
    showSuccess('Flag note saved')
  }
  closeFlagNotes()
}

// Enhanced image load handler
const handleImageLoad = () => {
  console.log('Photo loaded, updating flag positions')
  // Trigger flag position recalculation
  if (flags.value.length > 0) {
    flags.value = [...flags.value]
  }
}

// Form methods
const initializeForm = () => {
  const now = new Date()
  formData.value = {
    title: `Photo ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
    description: '',
    mediaCategory: GALLERY_CATEGORIES.PROGRESS,
    isPublic: true,
    sortOrder: 0,
    tags: []
  }
  
  flags.value = []
  tagsInput.value = ''
}

const applyQuickSettings = (type) => {
  switch (type) {
    case 'progress':
      formData.value.mediaCategory = GALLERY_CATEGORIES.PROGRESS
      formData.value.title = `Progress Photo ${new Date().toLocaleDateString()}`
      formData.value.tags = ['progress', 'construction']
      break
    case 'issue':
      formData.value.mediaCategory = GALLERY_CATEGORIES.ISSUE
      formData.value.title = `Issue Found ${new Date().toLocaleDateString()}`
      formData.value.tags = ['issue', 'problem']
      formData.value.isPublic = false
      break
    case 'before':
      formData.value.mediaCategory = GALLERY_CATEGORIES.BEFORE
      formData.value.title = `Before Work ${new Date().toLocaleDateString()}`
      formData.value.tags = ['before', 'baseline']
      break
    case 'after':
      formData.value.mediaCategory = GALLERY_CATEGORIES.AFTER
      formData.value.title = `After Work ${new Date().toLocaleDateString()}`
      formData.value.tags = ['after', 'completed']
      break
  }
  
  // Update tags input
  tagsInput.value = formData.value.tags.join(', ')
}

const processTags = () => {
  if (tagsInput.value.trim()) {
    formData.value.tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
  }
}

const removeTag = (index) => {
  formData.value.tags.splice(index, 1)
  tagsInput.value = formData.value.tags.join(', ')
}

const handleSave = async () => {
  try {
    isSaving.value = true
    
    // Convert image data to blob and file
    const response = await fetch(props.imageData.dataUrl)
    const blob = await response.blob()
    const extension = props.imageData.format === 'png' ? 'png' : 'jpg'
    const fileName = `${formData.value.title.replace(/[^a-zA-Z0-9]/g, '_')}.${extension}`
    const file = new File([blob], fileName, { type: `image/${props.imageData.format}` })

    // Prepare upload data (without flags for now)
    const uploadData = {
      nodeId: props.nodeId,
      mediaCategory: formData.value.mediaCategory,
      caption: formData.value.description,
      isPublic: formData.value.isPublic,
      sortOrder: formData.value.sortOrder,
      metadata: {
        title: formData.value.title,
        flags: flags.value.map(f => ({
          id: f.id,
          type: f.type,
          position: f.position,
          note: f.note,
          userId: f.userId,
          createdAt: f.createdAt
        })),
        tags: formData.value.tags.join(','),
        captureSource: props.imageData.source,
        captureDirection: props.imageData.direction,
        capturedAt: new Date().toISOString()
      }
    }

    // 1. First, upload the image
    const uploadResult = await galleryStore.uploadSingleFile(file, uploadData)
    const imageRecCode = uploadResult.results[0].recCode // Get the RecCode from upload response
    
    // 2. Then create notes for each flag using the NoteSave API
    for (const flag of flags.value) {
      if (flag.note && flag.note.trim()) {
            const noteData = {
          nodeId: props.nodeId,
          subject: `${formatFlagType(flag.type)} Flag Note`,
          noteContent: flag.note,
          noteType: 'Gallery',
          isImportant: false,
          isPrivate: false,
          nodeGalleryId: imageRecCode,                 // Gallery item recCode
          flagId: flag.id,               // Associate with the flag
          metadata: {
            flagId: flag.id,
            flagType: flag.type,
            flagPosition: flag.position,
            imageRecCode: imageRecCode, // Reference to the uploaded image
            userId: flag.userId,
            createdAt: flag.createdAt
          }
        }
        
        // Call the NoteSave API
        await noteService.createNote(noteData)
      }
    }
    
    emit('saved')
    showSuccess('Photo and notes saved successfully')
  } catch (error) {
    console.error('Error saving photo and notes:', error)
    showError('Failed to save photo and notes')
  } finally {
    isSaving.value = false
  }
}

const handleRetake = () => {
  emit('retake')
  handleClose()
}

const handleClose = () => {
  emit('close')
}

// Utility methods
// const optimizeImageData = (dataUrl) => {
//   return new Promise((resolve) => {
//     const canvas = document.createElement('canvas')
//     const ctx = canvas.getContext('2d')
//     const img = new Image()

//     img.onload = () => {
//       // Target dimensions
//       const maxWidth = 1920
//       const maxHeight = 1080
//       const quality = 0.8

//       let { width, height } = img

//       // Calculate resize ratio
//       if (width > maxWidth || height > maxHeight) {
//         const ratio = Math.min(maxWidth / width, maxHeight / height)
//         width *= ratio
//         height *= ratio
//       }

//       // Set canvas size
//       canvas.width = width
//       canvas.height = height

//       // Draw and compress
//       ctx.drawImage(img, 0, 0, width, height)

//       const optimizedDataUrl = canvas.toDataURL('image/jpeg', quality)

//       resolve({
//         dataUrl: optimizedDataUrl,
//         width,
//         height,
//         quality
//       })
//     }

//     img.src = dataUrl
//   })
// }

const getEstimatedFileSize = (dataUrl) => {
  if (!dataUrl) return null
  const base64 = dataUrl.split(',')[1]
  const sizeInBytes = (base64.length * 3) / 4
  return {
    bytes: Math.round(sizeInBytes),
    kb: Math.round(sizeInBytes / 1024),
    mb: Math.round((sizeInBytes / 1024 / 1024) * 100) / 100
  }
}

// const dataUrlToFile = (dataUrl, filename) => {
//   return new Promise((resolve) => {
//     const arr = dataUrl.split(',')
//     const mime = arr[0].match(/:(.*?);/)[1]
//     const bstr = atob(arr[1])
//     let n = bstr.length
//     const u8arr = new Uint8Array(n)

//     while (n--) {
//       u8arr[n] = bstr.charCodeAt(n)
//     }

//     resolve(new File([u8arr], filename, { type: mime }))
//   })
// }

const getSourceDescription = () => {
  if (!props.imageData) return 'Unknown'

  if (props.imageData.source === 'camera') {
    const direction = props.imageData.direction === 'front' ? 'Front' : 'Back'
    return `${direction} Camera`
  } else if (props.imageData.source === 'gallery') {
    return 'Photo Library'
  }

  return 'Camera'
}

const formatDateTime = (date) => {
  return date.toLocaleString()
}

const formatFlagType = (type) => {
  return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeForm()
  }
})

// Lifecycle
onMounted(() => {
  if (props.modelValue) {
    initializeForm()
  }
})
</script>

<style lang="scss" scoped>
// Fixed styles for CameraCaptureDialog.vue to prevent content overlapping

.camera-capture-dialog {
  .capture-dialog-card {
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden; // Prevent overflow at card level
  }
}

.dialog-header {
  background: linear-gradient(135deg, #26a69a 0%, #00897b 100%);
  color: white;
  padding: 24px;
  flex-shrink: 0; // Prevent header from shrinking
  z-index: 10; // Ensure header stays on top

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      display: flex;
      align-items: center;
    }
  }
}

.dialog-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex; // Add flex display
  flex-direction: column; // Stack children vertically
}

.capture-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden; // Prevent container overflow
}

.photo-preview-section {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0; // Prevent preview section from shrinking
  overflow: hidden; // Contain preview content
}

.preview-container {
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  max-height: 50vh;
  background: white;
  margin: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  cursor: crosshair;
  overflow: hidden; // Prevent image overflow

  .preview-image {
    max-width: 100%;
    max-height: 100%;
    border-radius: 8px;
    object-fit: contain;
  }

  .preview-placeholder {
    text-align: center;
    color: #999;
  }

  .flag-marker-photo {
    position: absolute;
    z-index: 100;
    pointer-events: auto;
    
    .flag-icon {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
      cursor: pointer;
      transition: transform 0.2s ease;
      animation: flagPulse 0.5s ease-out;

      &:hover {
        transform: scale(1.2);
      }

      &.clickable {
        cursor: pointer;
      }
    }
  }

  .tap-instruction {
    position: absolute;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    animation: fadeInOut 3s ease-in-out infinite;
    z-index: 50;
  }
}

.content-section {
  flex: 1;
  overflow-y: auto; // Allow scrolling for content
  overflow-x: hidden; // Prevent horizontal overflow
  display: flex;
  flex-direction: column;
  min-height: 0; // Important for flexbox overflow handling
}

.photo-info-card {
  margin: 24px 24px 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  overflow: hidden; // Contain card content
}

.form-section {
  padding: 24px;
  flex: 1;
  min-height: 0; // Allow shrinking if needed
  overflow-y: auto; // Allow form content to scroll
}

.capture-form {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px; // Consistent spacing between form elements
}

.flags-list {
  margin-bottom: 32px;
  flex-shrink: 0; // Prevent flags list from shrinking

  .section-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    color: #424242;
  }

  .flag-items {
    background: white;
    border-radius: 8px;
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
  }

  .flag-item {
    border-bottom: 1px solid #e0e0e0;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: #f5f5f5;
    }
  }
}

.form-group {
  transition: margin-bottom 0.3s ease;
  margin-bottom: 24px; // Consistent spacing
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  color: #424242;
}

.quick-actions {
  margin-bottom: 32px;
  flex-shrink: 0;

  .action-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.tags-display {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.form-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
  padding-top: 24px;
  border-top: 1px solid #e0e0e0;
  margin-top: 32px;
  flex-shrink: 0; // Prevent action buttons from shrinking
  position: sticky; // Keep actions visible
  bottom: 0;
  background: white;
  z-index: 5;
}

.visibility-options {
  display: flex;
  gap: 24px;
  padding: 8px 0;
  flex-wrap: wrap; // Allow wrapping on smaller screens
}

.visibility-description {
  display: flex;
  align-items: center;
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

// Focus styles
.capture-form {
  .q-field--focused {
    .q-field__control {
      box-shadow: 0 0 0 2px rgba(38, 166, 154, 0.2);
    }
  }
}

// Animations
@keyframes flagPulse {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes fadeInOut {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

// Speed dial styling
.q-fab {
  .q-fab__actions {
    .q-fab__action {
      margin-bottom: 8px;
    }
  }
}

// Flag positioning improvements
.flag-marker-photo {
  pointer-events: auto;
  cursor: pointer;
  transform-origin: center;
  
  &:hover {
    z-index: 1000; // Bring hovered flag to front
  }
}

// Mobile responsiveness with improved spacing
@media (max-width: 768px) {
  .preview-container {
    margin: 16px;
    padding: 16px;
    max-height: 40vh;
    min-height: 250px;
  }

  .photo-info-card {
    margin: 16px 16px 0;
  }

  .form-section {
    padding: 16px;
  }

  .capture-form {
    max-width: 100%;
    gap: 20px; // Slightly reduce gap on mobile
  }

  .action-chips {
    flex-direction: column;
    
    .q-chip {
      justify-content: flex-start;
    }
  }

  .form-actions {
    flex-direction: column-reverse;
    gap: 8px;

    .q-btn {
      width: 100%;
    }
  }

  .visibility-options {
    gap: 16px;
    flex-direction: column; // Stack on mobile
  }

  .flags-list {
    .flag-items {
      max-height: 150px;
    }
  }
}

@media (max-width: 480px) {
  .dialog-header {
    padding: 16px;
  }

  .preview-container {
    margin: 12px;
    padding: 12px;
    min-height: 200px;
  }

  .form-section {
    padding: 12px;
  }

  .capture-form {
    gap: 16px; // Further reduce gap on small mobile
  }

  .quick-actions {
    .action-chips {
      .q-chip {
        font-size: 12px;
        padding: 6px 12px;
      }
    }
  }

  .flags-list {
    margin-bottom: 20px;
    
    .flag-items {
      max-height: 120px;
    }
  }
}

// Dark mode support (if needed)
.body--dark {
  .photo-info-card,
  .flag-items {
    background: #1e1e1e;
    color: #e0e0e0;
  }

  .preview-container {
    background: #2a2a2a;
  }

  .visibility-description {
    background: rgba(255, 255, 255, 0.1);
  }

  .form-actions {
    background: #1e1e1e;
  }
}

// Accessibility improvements
.flag-icon {
  &:focus {
    outline: 2px solid #26a69a;
    outline-offset: 2px;
    border-radius: 50%;
  }
}

// Mobile touch improvements
@media (hover: none) and (pointer: coarse) {
  .flag-marker-photo {
    // Increase touch target size on mobile
    &::before {
      content: '';
      position: absolute;
      top: -12px;
      left: -12px;
      right: -12px;
      bottom: -12px;
      border-radius: 50%;
    }
  }
  
  .preview-container {
    .tap-instruction {
      display: flex; // Ensure tap instruction is visible on mobile
    }
  }
}

// Enhanced interaction feedback
.preview-container {
  &:hover {
    .tap-instruction {
      opacity: 0.8;
    }
  }
}

.q-chip {
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

// Form validation styles
.q-field--error {
  .q-field__control {
    border-color: #f44336;
  }
}

// Loading states
.q-btn--loading {
  pointer-events: none;
}

// Enhanced flag list styling
.flags-list {
  .flag-item {
    transition: all 0.2s ease;
    
    &:hover {
      background: #f0f8ff;
      transform: translateX(4px);
    }
  }
}

// Ensure proper scrolling behavior
* {
  box-sizing: border-box;
}

// Fix for content jumping during scroll
.content-section {
  scroll-behavior: smooth;
}
</style>