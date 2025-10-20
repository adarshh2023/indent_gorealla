<template>
  <q-dialog
    v-model="isOpen"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    class="video-recording-dialog"
  >
    <q-card class="recording-dialog-card">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="videocam" size="24px" class="q-mr-sm" />
            <div>
              <div class="text-h6">
                {{ isRecording ? 'Recording Video' : isPreview ? 'Video Preview' : 'Record Video' }}
              </div>
              <div class="text-caption text-grey-6">
                {{ isRecording ? 'Tap screen to add flags' : isPreview ? 'Review and add metadata' : 'Tap to start recording' }}
              </div>
            </div>
          </div>

          <div class="header-right">
            <q-btn
              v-if="!isRecording"
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

      <!-- Recording Interface -->
      <q-card-section v-if="!isPreview" class="recording-interface">
        <div class="video-container" ref="videoContainer" @click="handleScreenTap">
          <!-- Video Element -->
          <video
            ref="videoElement"
            :srcObject="mediaStream"
            autoplay
            muted
            playsinline
            class="video-preview"
          ></video>

          <!-- Recording Timer -->
          <div v-if="isRecording" class="recording-timer">
            <q-icon name="fiber_manual_record" color="red" class="recording-dot" />
            <span class="timer-text">{{ formatTime(recordingDuration) }}</span>
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

          <!-- Flag Markers During Recording -->
          <div
            v-for="flag in flags"
            :key="flag.id"
            class="flag-marker"
            :style="{
              position: 'absolute',
              left: `${flag.displayPosition ? flag.displayPosition.x : (flag.position.x * cameraContainerWidth)}px`,
              top: `${flag.displayPosition ? flag.displayPosition.y : (flag.position.y * cameraContainerHeight)}px`,
              zIndex: 999
            }"
          >
            <q-icon 
              :name="'flag'"
              :color="flag.type"
              size="24px"
              class="flag-icon"
            />
          </div>
        </div>

        <!-- Recording Controls -->
        <div class="recording-controls">
          <q-btn
            v-if="!isRecording"
            icon="videocam"
            color="red"
            size="lg"
            round
            @click="startRecording"
            :loading="isInitializing"
            class="record-button"
          >
            <q-tooltip>Start Recording</q-tooltip>
          </q-btn>

          <q-btn
            v-else
            icon="stop"
            color="red"
            size="lg"
            round
            @click="stopRecording"
            class="stop-button"
          >
            <q-tooltip>Stop Recording</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>

      <!-- Preview Interface -->
      <q-card-section v-else class="preview-interface">
        <div class="preview-container">
          <!-- Video Preview with Flags -->
          <div class="video-preview-section">
            <div class="video-wrapper" ref="videoWrapper">
              <video
                ref="previewVideoElement"
                :src="recordedVideoUrl"
                controls
                class="preview-video"
                @loadedmetadata="handleVideoLoaded"
                @timeupdate="handleTimeUpdate"
                @click="handleVideoClick"
              ></video>

              <!-- Flag Markers on Video -->
              <div
                v-for="flag in flags"
                :key="flag.id"
                class="flag-marker-preview"
                :style="getPreviewFlagStyle(flag)"
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

            <!-- Video Timeline with Flag Markers -->
            <div class="video-timeline">
              <div class="timeline-container" ref="timelineContainer">
                <div class="timeline-bar" @click="seekToTime">
                  <div class="timeline-progress" :style="{ width: `${playbackProgress}%` }"></div>
                  
                  <!-- Flag markers on timeline -->
                  <div
                    v-for="flag in flags"
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

          <!-- Flag List and Form -->
          <div class="form-section">
            <!-- Flags List -->
            <div class="flags-list" v-if="flags.length > 0">
              <div class="section-title">
                <q-icon name="flag" class="q-mr-sm" />
                Flags ({{ flags.length }})
              </div>
              <div class="flag-items">
                <q-item
                  v-for="flag in flags"
                  :key="flag.id"
                  class="flag-item"
                  clickable
                  @click="openFlagNotes(flag)"
                >
                  <q-item-section avatar>
                    <q-icon :name="'flag'" :color="flag.type" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ formatFlagType(flag.type) }} Flag</q-item-label>
                    <q-item-label caption>
                      {{ formatTime(flag.timestamp) }}
                      {{ flag.note ? `- ${flag.note.substring(0, 50)}...` : '' }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn
                      icon="delete"
                      flat
                      dense
                      round
                      size="sm"
                      @click.stop="removeFlag(flag.id)"
                    />
                  </q-item-section>
                </q-item>
              </div>
            </div>

            <!-- Video Form -->
            <q-form @submit="handleSave" class="video-form">
              <div class="form-group">
                <q-input
                  v-model="videoData.title"
                  label="Title *"
                  outlined
                  dense
                  :rules="[val => !!val || 'Title is required']"
                />
              </div>

              <div class="form-group">
                <q-input
                  v-model="videoData.description"
                  label="Description"
                  type="textarea"
                  outlined
                  rows="3"
                  dense
                />
              </div>

              <div class="form-group">
                <q-select
                  v-model="videoData.category"
                  label="Category"
                  :options="categoryOptions"
                  emit-value
                  map-options
                  outlined
                  dense
                />
              </div>

              <div class="form-group">
                <q-input
                  v-model="videoData.tags"
                  label="Tags (comma-separated)"
                  outlined
                  dense
                  placeholder="tag1, tag2, tag3"
                />
              </div>

              <div class="form-group">
                <div class="form-label">Visibility</div>
                <div class="visibility-options">
                  <q-radio
                    v-model="videoData.isPublic"
                    :val="true"
                    label="Public"
                    color="primary"
                  />
                  <q-radio
                    v-model="videoData.isPublic"
                    :val="false"
                    label="Private"
                    color="primary"
                  />
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions">
                <q-btn
                  label="Retake"
                  icon="videocam"
                  flat
                  @click="retakeVideo"
                  class="q-mr-sm"
                />
                <q-btn
                  label="Cancel"
                  flat
                  @click="handleClose"
                  class="q-mr-sm"
                />
                <q-btn
                  label="Save Video"
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
          At {{ formatTime(selectedFlag?.timestamp) }}
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useGalleryStore } from 'stores/gallery'
import { GALLERY_CATEGORIES } from 'src/utils/file'
import { showError, showSuccess } from 'src/utils/notification'
import NoteEditor from './NoteEditor.vue'
import { getCurrentUserId } from 'src/utils/auth'
import noteService from 'src/services/api/note.service' 

// Props
const props = defineProps({
  nodeId: {
    type: String,
    required: true
  },
  modelValue: {
    type: Boolean,
    default: false
  },
  projectUsers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'saved', 'close'])

// Store
const galleryStore = useGalleryStore()

// Refs
const videoElement = ref(null)
const previewVideoElement = ref(null)
const videoContainer = ref(null)
const videoWrapper = ref(null)
const timelineContainer = ref(null)

// State
const isOpen = ref(false)
const isInitializing = ref(false)
const isRecording = ref(false)
const isPreview = ref(false)
const isSaving = ref(false)
const mediaStream = ref(null)
const mediaRecorder = ref(null)
const recordedChunks = ref([])
const recordedVideoUrl = ref(null)
const recordingDuration = ref(0)
const recordingTimer = ref(null)
const videoDuration = ref(0)
const playbackProgress = ref(0)

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

// Container dimensions for flag positioning
const cameraContainerWidth = ref(0)
const cameraContainerHeight = ref(0)

// Video form data
const videoData = ref({
  title: '',
  description: '',
  category: GALLERY_CATEGORIES.PROGRESS,
  tags: '',
  isPublic: true
})

// Category options
const categoryOptions = [
  { label: 'Progress', value: GALLERY_CATEGORIES.PROGRESS },
  { label: 'Issues', value: GALLERY_CATEGORIES.ISSUE },
  { label: 'Before', value: GALLERY_CATEGORIES.BEFORE },
  { label: 'After', value: GALLERY_CATEGORIES.AFTER },
  { label: 'Blueprint', value: GALLERY_CATEGORIES.BLUEPRINT }
]

// Computed
const canSave = computed(() => {
  return videoData.value.title.trim() && recordedVideoUrl.value
})

// Methods
const initializeCamera = async () => {
  isInitializing.value = true
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { 
        facingMode: 'environment',
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: true
    })
    
    mediaStream.value = stream
    
    if (videoElement.value) {
      videoElement.value.srcObject = stream
    }
  } catch (error) {
    console.error('Error accessing camera:', error)
    showError('Failed to access camera')
  } finally {
    isInitializing.value = false
  }
}

const startRecording = async () => {
  if (!mediaStream.value) return

  try {
    recordedChunks.value = []
    flags.value = []
    recordingDuration.value = 0

    mediaRecorder.value = new MediaRecorder(mediaStream.value, {
      mimeType: 'video/webm;codecs=vp9'
    })

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.value.push(event.data)
      }
    }

    mediaRecorder.value.onstop = () => {
      const blob = new Blob(recordedChunks.value, { type: 'video/webm' })
      recordedVideoUrl.value = URL.createObjectURL(blob)
      isPreview.value = true
      isRecording.value = false
      stopCamera()
      
      // Set default title with timestamp
      const now = new Date()
      videoData.value.title = `Video Recording ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`
    }

    mediaRecorder.value.start()
    isRecording.value = true

    // Start timer
    recordingTimer.value = setInterval(() => {
      recordingDuration.value += 1
    }, 1000)

  } catch (error) {
    console.error('Error starting recording:', error)
    showError('Failed to start recording')
  }
}

const stopRecording = () => {
  if (mediaRecorder.value && isRecording.value) {
    mediaRecorder.value.stop()
    
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = null
    }
  }
}

const stopCamera = () => {
  if (mediaStream.value) {
    mediaStream.value.getTracks().forEach(track => track.stop())
    mediaStream.value = null
  }
}

// Fixed flag positioning functions
const handleScreenTap = (event) => {
  if (!isRecording.value || !videoContainer.value) return
  
  const container = videoContainer.value
  const containerRect = container.getBoundingClientRect()
  
  // Get tap position relative to container
  const tapX = event.clientX - containerRect.left
  const tapY = event.clientY - containerRect.top
  
  // Store container dimensions
  cameraContainerWidth.value = containerRect.width
  cameraContainerHeight.value = containerRect.height
  
  // Show speed dial at tap position
  speedDialPosition.value = { x: tapX, y: tapY }
  showFlagSpeedDial.value = true
}

const hideFlagSpeedDial = () => {
  showFlagSpeedDial.value = false
}

const addFlag = (type) => {
  if (!videoElement.value || !videoContainer.value || !isRecording.value) return

  // Check if user is authenticated
  const currentUserId = getCurrentUserId()
  if (!currentUserId) {
    showError('User not authenticated')
    return
  }

  const container = videoContainer.value
  const containerRect = container.getBoundingClientRect()
  
  // Calculate relative position from speed dial position
  const relativeX = speedDialPosition.value.x / containerRect.width
  const relativeY = speedDialPosition.value.y / containerRect.height

  const flag = {
    id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: type,
    timestamp: recordingDuration.value,
    position: {
      // Store RELATIVE coordinates (0-1 scale) for cross-device compatibility
      x: relativeX,
      y: relativeY
    },
    // Store display coordinates for immediate use during recording
    displayPosition: {
      x: speedDialPosition.value.x,
      y: speedDialPosition.value.y
    },
    note: '',
    userId: currentUserId, // 🟢 NEW: Add current user ID
    createdAt: new Date().toISOString() // 🟢 NEW: Add creation timestamp
  }

  flags.value.push(flag)
  hideFlagSpeedDial()
  showSuccess(`${formatFlagType(type)} flag added`)
}

const getPreviewFlagStyle = (flag) => {
  if (!flag.position || !previewVideoElement.value || !videoWrapper.value) {
    return { display: 'none' }
  }

  const container = videoWrapper.value
  const containerRect = container.getBoundingClientRect()
  
  // Convert relative coordinates back to absolute for current display
  const displayX = flag.position.x * containerRect.width
  const displayY = flag.position.y * containerRect.height

  return {
    position: 'absolute',
    left: `${displayX}px`,
    top: `${displayY}px`,
    zIndex: 999
  }
}

const handleVideoLoaded = () => {
  if (previewVideoElement.value) {
    videoDuration.value = previewVideoElement.value.duration
  }
}

const handleTimeUpdate = () => {
  if (previewVideoElement.value) {
    const currentTime = previewVideoElement.value.currentTime
    playbackProgress.value = (currentTime / videoDuration.value) * 100
  }
}

const handleVideoClick = (event) => {
  // Allow normal video controls
  event.stopPropagation()
}

const seekToTime = (event) => {
  if (!previewVideoElement.value || !timelineContainer.value) return

  const rect = timelineContainer.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const seekTime = percentage * videoDuration.value

  previewVideoElement.value.currentTime = seekTime
}

const seekToFlag = (flag) => {
  if (previewVideoElement.value) {
    previewVideoElement.value.currentTime = flag.timestamp
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
  
  // Pause video if playing
  if (previewVideoElement.value && !previewVideoElement.value.paused) {
    previewVideoElement.value.pause()
  }
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

const retakeVideo = () => {
  // Clean up previous recording
  if (recordedVideoUrl.value) {
    URL.revokeObjectURL(recordedVideoUrl.value)
    recordedVideoUrl.value = null
  }
  
  flags.value = []
  recordingDuration.value = 0
  isPreview.value = false
  
  // Restart camera
  initializeCamera()
}

const handleSave = async () => {
  if (!canSave.value) return

  isSaving.value = true
  try {
    // Convert blob to file
    const response = await fetch(recordedVideoUrl.value)
    const blob = await response.blob()
    const file = new File([blob], `${videoData.value.title}.webm`, { type: 'video/webm' })

    // Prepare upload data with flags in metadata
    const uploadData = {
      nodeId: props.nodeId,
      mediaCategory: videoData.value.category,
      caption: videoData.value.description,
      isPublic: videoData.value.isPublic,
      sortOrder: 0,
      metadata: {
        title: videoData.value.title,
        tags: videoData.value.tags,
        captureSource: 'camera',
        captureDevice: 'mobile_camera',
        recordingDuration: recordingDuration.value,
        flags: flags.value.map(flag => ({
          id: flag.id,
          type: flag.type,
          timestamp: flag.timestamp,
          position: {
            // Only save relative coordinates (0-1 scale)
            x: flag.position.x,
            y: flag.position.y
          },
          note: flag.note,
          userId: flag.userId,
          createdAt: flag.createdAt
        }))
      }
    }

    // 1. First, upload the video
    const uploadResult = await galleryStore.uploadSingleFile(file, uploadData)
    const videoRecCode = uploadResult.results[0].recCode // Get the RecCode from upload response
    
    // 2. Then create individual notes for each flag (if any have notes)
    for (const flag of flags.value) {
      if (flag.note && flag.note.trim()) {
            const noteData = {
          nodeId: props.nodeId,
          subject: `${formatFlagType(flag.type)} Flag Note`,
          noteContent: flag.note,
          noteType: 'Gallery',
          isImportant: false,
          isPrivate: false,
          nodeGalleryId: videoRecCode,                 // Gallery item recCode
          flagId: flag.id,               // Associate with the flag
          metadata: {
            flagId: flag.id,
            flagType: flag.type,
            flagPosition: flag.position,
            imageRecCode: videoRecCode, // Reference to the uploaded image
            userId: flag.userId,
            createdAt: flag.createdAt
          }
        }
        
        // Call the NoteSave API
        await noteService.createNote(noteData)
      }
    }
    
    emit('saved')
    showSuccess('Video saved successfully')
  } catch (error) {
    console.error('Error saving video:', error)
    showError('Failed to save video')
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  stopCamera()
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
    recordingTimer.value = null
  }
  
  if (recordedVideoUrl.value) {
    URL.revokeObjectURL(recordedVideoUrl.value)
  }
  
  emit('close')
}

// Utility functions
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatFlagType = (type) => {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue
  if (newValue) {
    nextTick(() => {
      initializeCamera()
    })
  }
})

watch(isOpen, (newValue) => {
  emit('update:modelValue', newValue)
  if (!newValue) {
    handleClose()
  }
})

// Lifecycle
onMounted(() => {
  if (props.modelValue) {
    isOpen.value = true
    initializeCamera()
  }
})

onUnmounted(() => {
  stopCamera()
  
  if (recordingTimer.value) {
    clearInterval(recordingTimer.value)
  }
  
  if (recordedVideoUrl.value) {
    URL.revokeObjectURL(recordedVideoUrl.value)
  }
})
</script>

<style lang="scss" scoped>
.video-recording-dialog {
  .recording-dialog-card {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #e91e63 0%, #c2185b 100%);
  color: white;
  padding: 24px;
  flex-shrink: 0;

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

.recording-interface {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.video-container {
  position: relative;
  flex: 1;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .video-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .recording-timer {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    display: flex;
    align-items: center;
    font-family: monospace;
    font-size: 16px;

    .recording-dot {
      animation: pulse 1s infinite;
      margin-right: 8px;
    }
  }

  .flag-marker {
    .flag-icon {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
      animation: flagPulse 0.5s ease-out;
    }
  }
}

.recording-controls {
  padding: 24px;
  display: flex;
  justify-content: center;
  background: white;

  .record-button,
  .stop-button {
    width: 80px;
    height: 80px;
  }
}

.preview-interface {
  flex: 1;
  padding: 0;
}

.preview-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  height: 100%;
  gap: 0;
}

.video-preview-section {
  background: #000;
  display: flex;
  flex-direction: column;
}

.video-wrapper {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  .preview-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .flag-marker-preview {
    .flag-icon {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.7));
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: scale(1.2);
      }
    }
  }
}

.video-timeline {
  background: rgba(0, 0, 0, 0.8);
  padding: 16px;

  .timeline-container {
    position: relative;
    height: 6px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    cursor: pointer;

    .timeline-progress {
      height: 100%;
      background: #e91e63;
      border-radius: 3px;
      transition: width 0.1s ease;
    }

    .timeline-flag {
      position: absolute;
      top: -8px;
      transform: translateX(-50%);
      cursor: pointer;
      transition: transform 0.2s ease;

      &:hover {
        transform: translateX(-50%) scale(1.2);
      }
    }
  }
}

.form-section {
  background: #f8f9fa;
  padding: 24px;
  overflow-y: auto;
}

.flags-list {
  margin-bottom: 32px;

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

  .no-flags {
    text-align: center;
    padding: 32px;
    color: #999;
  }
}

.video-form {
  .form-group {
    margin-bottom: 24px;
  }

  .form-label {
    font-weight: 500;
    margin-bottom: 8px;
    color: #424242;
  }

  .visibility-options {
    display: flex;
    gap: 16px;
    margin-top: 8px;
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #e0e0e0;
  }
}

// Animations
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

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

// Responsive design
@media (max-width: 768px) {
  .preview-container {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr auto;
  }
  
  .form-section {
    max-height: 40vh;
  }
  
  .flags-list {
    margin-bottom: 16px;
    
    .flag-items {
      max-height: 120px;
    }
  }
}

@media (max-width: 480px) {
  .dialog-header {
    padding: 16px;
  }
  
  .recording-controls {
    padding: 16px;
  }
  
  .form-section {
    padding: 16px;
  }
  
  .video-form .form-actions {
    flex-direction: column;
    gap: 12px;
  }
}

// Flag positioning improvements
.flag-marker,
.flag-marker-preview {
  pointer-events: auto;
  cursor: pointer;
  
  .flag-icon {
    transition: all 0.2s ease;
    
    &.clickable:hover {
      transform: scale(1.2);
    }
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

// Timeline enhancements
.timeline-bar {
  position: relative;
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  cursor: pointer;
  
  &:hover {
    .timeline-flag {
      opacity: 1;
      transform: translateX(-50%) scale(1.1);
    }
  }
}

// Modal styling
.q-dialog .q-card {
  .scroll {
    // Ensure note editor has proper styling within modal
    :deep(.note-editor) {
      border: none;
      box-shadow: none;
      
      .q-field {
        margin-bottom: 16px;
      }
      
      .note-actions {
        padding-top: 16px;
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        display: flex;
        justify-content: flex-end;
        gap: 8px;
      }
    }
  }
}
</style>