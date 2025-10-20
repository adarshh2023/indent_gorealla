<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="handleDialogUpdate"
    maximized
    transition-show="fade"
    transition-hide="fade"
    class="media-viewer-dialog"
  >
    <q-card class="media-viewer-card">
      <!-- Header -->
      <div class="viewer-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon 
              :name="getMediaIcon()" 
              size="md" 
              class="q-mr-md"
            />
            <div>
              <div class="text-h6">{{ props.item?.caption || props.item?.originalFileName || 'Media Viewer' }}</div>
              <div class="text-subtitle2 text-grey-4">
                {{ formatFileSize(props.item?.fileSize) }} • 
                {{ formatDate(props.item?.insertDate) }}
                <span v-if="isVideo && videoDuration">
                  • {{ formatTime(videoDuration) }}
                </span>
                <span v-if="isPdf && totalPages">
                  • {{ totalPages }} pages
                </span>
              </div>
            </div>
          </div>
          
          <div class="header-right">
            <q-btn 
              icon="edit" 
              flat 
              round 
              @click="handleEdit"
              v-if="canEdit"
            >
              <q-tooltip>Edit</q-tooltip>
            </q-btn>
            
            <q-btn 
              icon="download" 
              flat 
              round 
              @click="handleDownload"
            >
              <q-tooltip>Download</q-tooltip>
            </q-btn>
            
            <q-btn 
              icon="delete" 
              flat 
              round 
              @click="handleDelete"
              v-if="canDelete"
            >
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
            
            <q-btn 
              icon="close" 
              flat 
              round 
              @click="handleClose"
            >
              <q-tooltip>Close</q-tooltip>
            </q-btn>
          </div>
        </div>
      </div>

      <!-- Media Content -->
      <!-- Media Content -->
      <div class="viewer-content">
        <!-- New Layout Container: Media Left, Flags Sidebar Right -->
        <div class="viewer-layout">
          <!-- Media Section (Left) -->
          <div class="media-section">
            <!-- Image Viewer -->
            <div 
              v-if="isImage" 
              class="media-container image-container"
              ref="imageContainer"
            >
              <img
                :src="mediaUrl"
                :alt="props.item?.caption || 'Image'"
                class="media-image"
                @load="handleImageLoad"
                @error="handleImageError"
              />
              
              <!-- Image Flags -->
              <div
                v-for="flag in flags"
                :key="flag.id"
                :style="getImageFlagStyle(flag)"
                class="flag-marker flag-marker-image"
                @click="openFlagNotes(flag)"
              >
                <q-icon :name="'flag'" :color="getFlagColor(flag.type)" size="20px" />
              </div>
            </div>

            <!-- Video Viewer -->
            <div 
              v-else-if="isVideo" 
              class="media-container video-container"
              ref="videoContainer"
            >
              <video
                ref="videoElement"
                :src="mediaUrl"
                controls
                class="media-video"
                @loadedmetadata="handleVideoLoaded"
                @timeupdate="handleTimeUpdate"
                @play="handleVideoPlay"
                @pause="handleVideoPause"
              />
              
              <!-- Video Timeline -->
              <div 
                v-if="videoDuration > 0"
                class="video-timeline"
                ref="timelineWrapper"
                @click="seekToTime"
              >
                <div 
                  class="timeline-progress"
                  :style="{ width: playbackProgress + '%' }"
                ></div>
                
                <!-- Video Timeline Flags -->
                <div
                  v-for="flag in flags"
                  :key="flag.id"
                  :style="getVideoTimelineStyle(flag)"
                  class="timeline-flag"
                  @click.stop="seekToFlag(flag)"
                >
                  <q-icon :name="'flag'" :color="getFlagColor(flag.type)" size="24px" class="flag-icon clickable" />
                </div>
              </div>
              
              <!-- Video Overlay Flags -->
              <div
                v-for="flag in flags"
                :key="`overlay-${flag.id}`"
                :style="getVideoFlagStyle(flag)"
                class="flag-marker flag-marker-video"
                @click="openFlagNotes(flag)"
              >
                <q-icon :name="'flag'" :color="getFlagColor(flag.type)" size="16px" class="timeline-flag-icon" />
              </div>
            </div>

            <!-- Audio Viewer -->
            <div 
              v-else-if="isAudio" 
              class="media-container audio-container"
            >
              <div class="audio-player">
                <q-icon name="audiotrack" size="4em" class="audio-icon" />
                <audio
                  :src="mediaUrl"
                  controls
                  class="audio-element"
                />
              </div>
            </div>

            <!-- PDF Viewer -->
            <div 
              v-else-if="isPdf" 
              class="media-container pdf-container"
              ref="pdfContainer"
            >
              <div v-if="isLoadingPdf" class="pdf-loading">
                <q-spinner color="primary" size="3em" />
                <div class="q-mt-md">Loading PDF...</div>
              </div>
              
              <div v-else-if="pdfError" class="pdf-error">
                <q-icon name="error" color="negative" size="3em" />
                <div class="q-mt-md text-negative">{{ pdfError }}</div>
              </div>
              
              <div v-else class="pdf-display">
                <!-- PDF Controls -->
                <div class="pdf-controls">
                  <div class="page-controls">
                    <q-btn
                      icon="chevron_left"
                      flat
                      round
                      @click="previousPage"
                      :disable="currentPage <= 1"
                    />
                    <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
                    <q-btn
                      icon="chevron_right"
                      flat
                      round
                      @click="nextPage"
                      :disable="currentPage >= totalPages"
                    />
                  </div>
                  
                  <div class="zoom-controls">
                    <q-btn
                      icon="zoom_out"
                      flat
                      round
                      @click="zoomOut"
                      :disable="scale <= 0.5"
                    />
                    <span class="zoom-info">{{ Math.round(scale * 100) }}%</span>
                    <q-btn
                      icon="zoom_in"
                      flat
                      round
                      @click="zoomIn"
                      :disable="scale >= 3"
                    />
                    <q-btn
                      icon="fit_screen"
                      flat
                      round
                      @click="fitToWidth"
                    />
                  </div>
                </div>
                
                <!-- PDF Canvas Container -->
                <div class="pdf-canvas-container">
                  <canvas 
                    ref="pdfCanvas" 
                    class="pdf-canvas"
                  ></canvas>
                  
                  <!-- PDF Flags -->
                  <div
                    v-for="flag in currentPageFlags"
                    :key="flag.id"
                    :style="getPdfFlagStyle(flag)"
                    class="flag-marker flag-marker-pdf"
                    @click="openFlagNotes(flag)"
                  >
                    <q-icon :name="'flag'" :color="getFlagColor(flag.type)" size="20px" class="flag-icon" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Unsupported File Type -->
            <div 
              v-else 
              class="media-container unsupported-container"
            >
              <div class="unsupported-content">
                <q-icon name="description" size="4em" class="text-grey-6" />
                <div class="q-mt-md text-grey-6">Preview not available</div>
                <q-btn 
                  color="primary" 
                  outline 
                  @click="handleDownload"
                  class="q-mt-md"
                >
                  Download File
                </q-btn>
              </div>
            </div>
          </div>

          <!-- Flags Sidebar (Right) - Only if flags exist -->
          <div v-if="flags.length > 0" class="flags-sidebar">
            <div class="flags-header">
              <q-icon name="flag" class="q-mr-sm" />
              <span>Flags ({{ flags.length }})</span>
            </div>
            
            <div class="flags-list">
              <div
                v-for="flag in flags"
                :key="flag.id"
                class="flag-item"
                @click="openFlagNotes(flag)"
              >
                <q-icon 
                  :name="'flag'" 
                  :color="getFlagColor(flag.type)" 
                  size="16px" 
                  class="flag-item-icon"
                />
                
                <div class="flag-item-content">
                  <div class="flag-item-title">{{ formatFlagType(flag.type) }} Flag</div>
                  <!-- <div v-if="flag.note" class="flag-item-note">{{ flag.note }}</div> -->
                  <div class="flag-item-meta">
                    <span v-if="flag.timestamp !== undefined && isVideo">
                      Time: {{ formatTime(flag.timestamp) }}
                    </span>
                    <span v-if="flag.page && isPdf">
                      Page: {{ flag.page }}
                    </span>
                    <span v-if="flag.createdBy" class="flag-date">
                      By: {{ getUserDisplayName(flag.createdBy) }}
                    </span>
                  </div>
                </div>
                
                <q-btn
                  icon="notes"
                  flat
                  round
                  dense
                  size="sm"
                  @click.stop="openFlagNotes(flag)"
                  class="flag-item-action"
                >
                  <q-tooltip>View Notes</q-tooltip>
                </q-btn>
                <q-btn
      icon="delete"
      flat
      round
      dense
      size="sm"
      color="red-5"
      @click.stop="deleteFlag(flag)"
      class="flag-item-action"
    >
      <q-tooltip>Delete Flag</q-tooltip>
    </q-btn>
              </div>
            </div>
          </div>
        </div>
      </div>


      <!-- Flags Panel -->
      <!-- <div v-if="flags.length > 0" class="flags-panel">
  <q-expansion-item
    icon="flag"
    :label="`Flags (${flags.length})`"
    default-opened
    class="flags-expansion"
  >
    <div class="flags-list">
      <div
        v-for="flag in flags"
        :key="flag.id"
        class="flag-item"
        @click="handleFlagClick(flag)"
      >
        <q-icon :name="'flag'" :color="getFlagColor(selectedFlag?.type)" size="24px" class="q-mr-sm" />

        <div class="flag-item-content">
          <div class="flag-item-title">{{ formatFlagType(flag.type) }}</div>
          <div v-if="flag.note" class="flag-item-note">{{ flag.note }}</div>
          <div class="flag-item-meta">
            <span v-if="isVideo && flag.timestamp !== undefined">
              {{ formatTime(flag.timestamp) }}
            </span>
            <span v-else-if="isPdf && flag.page">
              Page {{ flag.page }}
            </span>
            <span class="flag-date">{{ formatDate(flag.createdAt) }}</span>
          </div>
        </div>
        <div class="flag-item-actions">
          <q-btn
            v-if="isVideo && flag.timestamp !== undefined"
            icon="play_arrow"
            flat
            dense
            size="sm"
            color="primary"
            @click.stop="seekToFlag(flag)"
          >
            <q-tooltip>Jump to timestamp</q-tooltip>
          </q-btn>
          <q-btn
            v-if="flag.note"
            icon="notes"
            flat
            dense
            size="sm"
            color="info"
            @click.stop="openFlagNotes(flag)"
          >
            <q-tooltip>View notes</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>
  </q-expansion-item>
</div> -->
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
            <span v-else-if="isPdf && selectedFlag?.page">
              Page {{ selectedFlag.page }}
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
            <span v-else-if="isPdf && selectedFlag?.page">
              Page {{ selectedFlag.page }}
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
                    <div v-html="note.noteContent || 'No content'"></div>
                  </div>

                  <!-- Note Mentions -->
                  <div v-if="note.mentions && note.mentions.length > 0" class="note-mentions q-mt-sm">
                    <div class="text-caption text-grey-6 q-mb-xs">Mentioned:</div>
                    <div class="mentions-chips">
                      <q-chip
                        v-for="mention in note.mentions"
                        :key="mention.recCode"
                        size="sm"
                        color="primary"
                        text-color="white"
                        icon="alternate_email"
                        class="q-mr-xs q-mb-xs"
                      >
                        {{ mention.name }}
                      </q-chip>
                    </div>
                  </div>

                  <!-- Note Type -->
                  <div v-if="note.noteType && note.noteType !== 'General'" class="q-mt-sm">
                    <q-chip 
                      size="sm" 
                      outline 
                      color="secondary"
                      :label="note.noteType"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>

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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { GALLERY_MEDIA_TYPES } from 'src/utils/file'
import { showSuccess, showConfirm, showError } from 'src/utils/notification'
import NoteEditor from './NoteEditor.vue'
import * as pdfjsLib from 'pdfjs-dist'
import noteService from 'src/services/api/note.service' 
import { getCurrentUserId } from 'src/utils/auth'
import galleryService from 'src/services/api/gallery.service'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  },
  projectUsers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'edit', 'delete', 'download', 'flag-updated'])

// Refs
const imageContainer = ref(null)
const videoContainer = ref(null)
const videoElement = ref(null)
const timelineWrapper = ref(null)
const pdfContainer = ref(null)
const pdfCanvas = ref(null)

// State
const isOpen = ref(false)
const flags = ref([])
const showFlagNotesModal = ref(false)
const selectedFlag = ref(null)
const flagNoteData = ref({
  subject: '',
  noteContent: '',
  mentions: []
})

// NEW: Enhanced flag notes data (ADDED - no existing functionality removed)
const flagNotes = ref([]) // Store notes for selected flag
const showFlagNotesList = ref(false) // Show notes list dialog
const isLoadingFlagNotes = ref(false) // Loading state

// Video state
const videoDuration = ref(0)
const currentTime = ref(0)
const playbackProgress = ref(0)
const isVideoPlaying = ref(false)

// PDF state
const isLoadingPdf = ref(false)
const pdfError = ref('')
const pdfDocument = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const scale = ref(1)
const pageRendering = ref(false)

// Computed
const mediaUrl = computed(() => {
  return props.item?.fileUrl || props.item?.downloadUrl || null
})

const isImage = computed(() => {
  return props.item?.mediaType === GALLERY_MEDIA_TYPES.IMAGE
})

const isVideo = computed(() => {
  return props.item?.mediaType === GALLERY_MEDIA_TYPES.VIDEO
})

const isAudio = computed(() => {
  return props.item?.mediaType === GALLERY_MEDIA_TYPES.AUDIO
})

const isPdf = computed(() => {
  return props.item?.mediaType === GALLERY_MEDIA_TYPES.PDF || 
         props.item?.originalFileName?.toLowerCase().endsWith('.pdf') ||
         props.item?.mimeType === 'application/pdf'
})

const currentPageFlags = computed(() => {
  if (!isPdf.value) return flags.value
  return flags.value.filter(flag => flag.page === currentPage.value)
})

const canEdit = computed(() => {
  // Add your edit permission logic here
  return true
})

const canDelete = computed(() => {
  // Add your delete permission logic here
  return true
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

// Methods (ALL EXISTING PRESERVED)
const handleDialogUpdate = (value) => {
  emit('update:modelValue', value)
}

const loadFlags = () => {
  console.log('Loading flags for item:', props.item?.id)
  
  if (props.item?.metadata?.flags) {
    // Ensure flags is an array
    flags.value = Array.isArray(props.item.metadata.flags) ? props.item.metadata.flags : []
    console.log('MediaViewer flags loaded:', flags.value.length, flags.value)
    
    // For PDF, load total pages from metadata
    if (isPdf.value && props.item.metadata.totalPages) {
      totalPages.value = props.item.metadata.totalPages
    }
  } else {
    flags.value = []
    console.log('No flags found in item metadata')
  }
}


const getMediaIcon = () => {
  if (isImage.value) return 'image'
  if (isVideo.value) return 'videocam'
  if (isAudio.value) return 'audiotrack'
  if (isPdf.value) return 'picture_as_pdf'
  return 'description'
}

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatFlagType = (type) => {
  return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// const getFlagIcon = (type) => {
//   const icons = {
//     issue: 'error',
//     progress: 'check_circle',
//     concern: 'warning',
//     note: 'note',
//     defect: 'bug_report',
//     rework: 'refresh'
//   }
//   return icons[type] || 'flag'
// }

const getFlagColor = (flagType) => {
  const colorMap = {
    'red': 'red',
    'yellow': 'amber',
    'green': 'green',
    'grey': 'grey'
  }
  return colorMap[flagType] || 'grey'
}

const deleteFlag = async (flagToDelete) => {
  try {
    console.log('Deleting flag:', flagToDelete)
    console.log('Flag to delete ID:', flagToDelete.id, 'FlagId:', flagToDelete.flagId)
    console.log('Current flags before deletion:', flags.value.length)
    console.log('All current flags:', flags.value.map(f => ({ id: f.id, flagId: f.flagId, type: f.type })))
    
    if (!props.item?.metadata) {
      console.error('No metadata found on item')
      showError('Unable to delete flag: No metadata found')
      return
    }

    // Create updated metadata by removing the flag with matching flagId
    const updatedMetadata = { ...props.item.metadata }
    
    if (updatedMetadata.flags && Array.isArray(updatedMetadata.flags)) {
      console.log('Original metadata flags:', updatedMetadata.flags.length)
      console.log('Metadata flags details:', updatedMetadata.flags.map(f => ({ id: f.id, flagId: f.flagId, type: f.type })))
      
      // More robust flag identification - check multiple possible ID fields
      const flagToDeleteId = flagToDelete.id || flagToDelete.flagId
      
      // Remove the flag by filtering out the one with matching identifier
      const filteredMetadataFlags = updatedMetadata.flags.filter(flag => {
        const flagId = flag.id || flag.flagId
        const shouldKeep = flagId !== flagToDeleteId
        console.log(`Flag ${flagId}: ${shouldKeep ? 'KEEP' : 'DELETE'}`)
        return shouldKeep
      })
      
      updatedMetadata.flags = filteredMetadataFlags
      
      console.log('Filtered metadata flags:', filteredMetadataFlags.length)
      console.log('Metadata after filtering:', filteredMetadataFlags.map(f => ({ id: f.id, flagId: f.flagId, type: f.type })))
      
      // Call the API to update metadata
      await galleryService.updateMediaMetadata(props.item.recCode, updatedMetadata)
      
      // Update local flags array using the same logic
        const filteredLocalFlags = flags.value.filter(flag => {
          const flagId = flag.id || flag.flagId
          const shouldKeep = flagId !== flagToDeleteId
          console.log(`Local flag ${flagId}: ${shouldKeep ? 'KEEP' : 'DELETE'}`)
          return shouldKeep
        })
        
        console.log('Filtered local flags:', filteredLocalFlags.length)
        console.log('Local flags after filtering:', filteredLocalFlags.map(f => ({ id: f.id, flagId: f.flagId, type: f.type })))
        
        // Update the reactive array
        flags.value = [...filteredLocalFlags]
        
        console.log('Final flags.value length:', flags.value.length)
        console.log('Flag deleted successfully')
        showSuccess('Flag deleted successfully')
        
        // Emit event to parent
        emit('flag-deleted', { 
          deletedFlag: flagToDelete, 
          remainingFlagsCount: flags.value.length,
          item: props.item 
        })
    } else {
      console.error('No flags array found in metadata')
      showError('No flags found to delete')
    }
  } catch (error) {
    console.error('Error deleting flag:', error)
    showError('An error occurred while deleting the flag')
  }
}





// Flag visibility functions (ALL EXISTING PRESERVED)
const shouldShowFlag = (flag) => {
  if (!isVideo.value || flag.timestamp === undefined || flag.timestamp === null) {
    return true
  }
  
  const tolerance = 0.5
  return Math.abs(currentTime.value - flag.timestamp) <= tolerance
}

// const isCurrentFlag = (flag) => {
//   if (!isVideo.value || flag.timestamp === undefined || flag.timestamp === null) {
//     return false
//   }
  
//   const tolerance = 0.2
//   return Math.abs(currentTime.value - flag.timestamp) <= tolerance
// }

// Image handling methods (ALL EXISTING PRESERVED)
const handleImageLoad = () => {
  console.log('MediaViewer image loaded')
  nextTick(() => {
    if (flags.value.length > 0) {
      flags.value = [...flags.value]
    }
  })
}

const handleImageError = () => {
  console.error('Failed to load image')
  showError('Failed to load image')
}

const getImageFlagStyle = (flag) => {
  if (!flag.position || !imageContainer.value) {
    return { display: 'none' }
  }

  const container = imageContainer.value
  const containerRect = container.getBoundingClientRect()
  const img = container.querySelector('.media-image')
  
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

// Video handling methods (ALL EXISTING PRESERVED)
const handleVideoLoaded = () => {
  console.log('MediaViewer video loaded')
  if (videoElement.value) {
    videoDuration.value = videoElement.value.duration
    nextTick(() => {
      if (flags.value.length > 0) {
        flags.value = [...flags.value]
      }
    })
  }
}

const handleTimeUpdate = () => {
  if (videoElement.value) {
    currentTime.value = videoElement.value.currentTime
    playbackProgress.value = (currentTime.value / videoDuration.value) * 100
  }
}

const handleVideoPlay = () => {
  isVideoPlaying.value = true
}

const handleVideoPause = () => {
  isVideoPlaying.value = false
}

const seekToTime = (event) => {
  if (!videoElement.value || !timelineWrapper.value) return

  const rect = timelineWrapper.value.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const seekTime = percentage * videoDuration.value

  videoElement.value.currentTime = seekTime
}

const seekToFlag = (flag) => {
  if (isVideo.value && videoElement.value && flag.timestamp !== undefined) {
    videoElement.value.currentTime = flag.timestamp
  }
}

const getVideoFlagStyle = (flag) => {
  if (!flag.position || !videoElement.value || !videoContainer.value) {
    return { display: 'none' }
  }

  const video = videoElement.value
  const container = videoContainer.value
  
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
  
  const isVisible = shouldShowFlag(flag)
  const opacity = isVisible ? 1 : 0

  return {
    position: 'absolute',
    left: `${displayX}px`,
    top: `${displayY}px`,
    zIndex: 999,
    opacity: opacity,
    transition: 'opacity 0.3s ease',
    pointerEvents: isVisible ? 'auto' : 'none'
  }
}

const getVideoTimelineStyle = (flag) => {
  if (!flag.timestamp || videoDuration.value === 0) {
    return { display: 'none' }
  }

  const percentage = (flag.timestamp / videoDuration.value) * 100
  
  return {
    position: 'absolute',
    left: `${percentage}%`,
    top: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1000
  }
}

// PDF handling methods (ALL EXISTING PRESERVED)
const loadPdf = async () => {
  if (!mediaUrl.value) return

  isLoadingPdf.value = true
  pdfError.value = ''

  try {
    console.log('Loading PDF from:', mediaUrl.value)
    const loadingTask = pdfjsLib.getDocument(mediaUrl.value)
    pdfDocument.value = await loadingTask.promise
    totalPages.value = pdfDocument.value.numPages
    console.log('PDF loaded, total pages:', totalPages.value)
    
    await renderPage(1)
  } catch (error) {
    console.error('Error loading PDF:', error)
    pdfError.value = 'Failed to load PDF'
  } finally {
    isLoadingPdf.value = false
  }
}

const renderPage = async (pageNum) => {
  if (!pdfDocument.value || !pdfCanvas.value || pageRendering.value) return

  pageRendering.value = true

  try {
    console.log('Rendering page:', pageNum)
    const page = await pdfDocument.value.getPage(pageNum)
    const viewport = page.getViewport({ scale: scale.value })
    
    const canvas = pdfCanvas.value
    const context = canvas.getContext('2d')
    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = {
      canvasContext: context,
      viewport: viewport
    }

    await page.render(renderContext).promise
    currentPage.value = pageNum
    console.log('Page rendered successfully')
  } catch (error) {
    console.error('Error rendering page:', error)
  } finally {
    pageRendering.value = false
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    renderPage(currentPage.value - 1)
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    renderPage(currentPage.value + 1)
  }
}

const zoomIn = () => {
  if (scale.value < 3) {
    scale.value += 0.25
    renderPage(currentPage.value)
  }
}

const zoomOut = () => {
  if (scale.value > 0.5) {
    scale.value -= 0.25
    renderPage(currentPage.value)
  }
}

const fitToWidth = () => {
  if (pdfContainer.value && pdfCanvas.value) {
    const containerWidth = pdfContainer.value.clientWidth - 40 // padding
    const canvasWidth = pdfCanvas.value.width / scale.value
    const newScale = containerWidth / canvasWidth
    scale.value = Math.max(0.5, Math.min(3, newScale))
    renderPage(currentPage.value)
  }
}

// const goToPage = (pageNumber) => {
//   if (pageNumber >= 1 && pageNumber <= totalPages.value) {
//     renderPage(pageNumber)
//   }
// }

const getPdfFlagStyle = (flag) => {
  if (!flag.position || !pdfCanvas.value || !pdfContainer.value) {
    return { display: 'none' }
  }

  const canvas = pdfCanvas.value
  const container = pdfContainer.value.querySelector('.pdf-canvas-container')
  
  if (!container) {
    return { display: 'none' }
  }

  const canvasRect = canvas.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  
  const displayX = (flag.position.x * canvasRect.width) + (canvasRect.left - containerRect.left)
  const displayY = (flag.position.y * canvasRect.height) + (canvasRect.top - containerRect.top)

  return {
    position: 'absolute',
    left: `${displayX}px`,
    top: `${displayY}px`,
    zIndex: 999,
    pointerEvents: 'auto'
  }
}

// Flag methods (ENHANCED - existing preserved, new functionality added)
const openFlagNotes = async (flag) => {
  selectedFlag.value = flag
  flagNoteData.value = {
    subject: `${formatFlagType(flag.type)} Flag Note`,
    noteContent: flag.note || '',
    mentions: []
  }
  showFlagNotesModal.value = true
  
  if (videoElement.value && !videoElement.value.paused) {
    videoElement.value.pause()
  }

  // NEW: Load existing notes for this flag
  await loadFlagNotes(flag.id)
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
      nodeGalleryId: props.item.recCode,                 // Gallery item recCode
      flagId: selectedFlag.value.id,               // Associate with the flag
      noteType: 'Gallery',                               // Set note type as Gallery
      userId: currentUserId // Include current user ID
    })

    // Save the flag note
    const response = await noteService.createNote(apiNoteData)
    
    if (response.success) {
      // Update the flag with the saved note
      const flagIndex = flags.value.findIndex(f => f.id === selectedFlag.value.id)
      if (flagIndex !== -1) {
        flags.value[flagIndex].note = {
          id: response.data.recCode,
          userId: currentUserId,
          createdAt: new Date().toISOString(),
          ...noteData
        }
      }

      // Emit flag updated event
      emit('flag-updated', {
        flagId: selectedFlag.value.id,
        note: response.data
      })

      showSuccess('Flag note saved successfully')
      closeFlagNotes()
    }
  } catch (error) {
    console.error('Failed to save flag note:', error)
    showError('Failed to save flag note')
  }
}

// const handleFlagClick = (flag) => {
//   if (isVideo.value && flag.timestamp !== undefined) {
//     seekToFlag(flag)
//   } else if (isPdf.value && flag.page && flag.page !== currentPage.value) {
//     goToPage(flag.page)
//   }
//   openFlagNotes(flag)
// }

// Action handlers (ALL EXISTING PRESERVED)
const handleEdit = () => {
  emit('edit', props.item)
}

const handleDelete = async () => {
  const confirmed = await showConfirm(
    'Delete Media',
    'Are you sure you want to delete this media file? This action cannot be undone.',
    'Delete'
  )
  
  if (confirmed) {
    emit('delete', props.item)
  }
}

const handleDownload = () => {
  if (mediaUrl.value) {
    const link = document.createElement('a')
    link.href = mediaUrl.value
    link.download = props.item?.originalFileName || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  emit('download', props.item)
}

const handleClose = () => {
  emit('update:modelValue', false)
}

// Window resize handler (ALL EXISTING PRESERVED)
const handleResize = () => {
  if (flags.value.length > 0) {
    nextTick(() => {
      flags.value = [...flags.value]
    })
  }
  
  if (isPdf.value && pdfDocument.value && currentPage.value) {
    fitToWidth()
  }
}


// Watchers (ALL EXISTING PRESERVED - CRITICAL: Missing watcher was the issue!)
watch(() => props.modelValue, (newValue) => {
  isOpen.value = newValue
  if (newValue && props.item) {
    loadFlags()
    if (isPdf.value) {
      nextTick(() => {
        loadPdf()
      })
    }
  }
})

watch(() => props.item, (newItem) => {
  if (newItem) {
    loadFlags()
  }
}, { deep: true })

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    console.log('MediaViewer opened, loading flags...')
    nextTick(() => {
      loadFlags()
    })
  }
})

watch(() => props.item, (newItem) => {
  if (newItem) {
    loadFlags()
    
    // Reset states
    videoDuration.value = 0
    currentTime.value = 0
    playbackProgress.value = 0
    isVideoPlaying.value = false
    
    // Load PDF if it's a PDF file
    if (isPdf.value) {
      nextTick(() => {
        loadPdf()
      })
    }
  }
}, { immediate: true })


const refreshFlags = () => {
  loadFlags()
}

defineExpose({
  refreshFlags
})

// Lifecycle (ALL EXISTING PRESERVED)
onMounted(() => {
  window.addEventListener('resize', handleResize)
  
  if (props.item) {
    loadFlags()
    if (isPdf.value) {
      nextTick(() => {
        loadPdf()
      })
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (videoElement.value && !videoElement.value.paused) {
    videoElement.value.pause()
  }
})
</script>

<style lang="scss" scoped>
.media-viewer-dialog {
  .media-viewer-card {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: #000;
    color: white;
  }
}

.viewer-header {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 16px 24px;
  flex-shrink: 0;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-left {
      display: flex;
      align-items: center;
    }

    .header-right {
      display: flex;
      align-items: center;
    }
  }
}

/* NEW LAYOUT STYLES - Media Left, Flags Sidebar Right */
.viewer-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: row;
}

.viewer-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

/* Media Section (Left Side) */
.media-section {
  flex: 1;
  position: relative;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Flags Sidebar (Right Side) - Only when flags exist */
.flags-sidebar {
  width: 300px;
  background: rgba(0, 0, 0, 0.95);
  color: white;
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;

  .flags-header {
    padding: 16px;
    display: flex;
    align-items: center;
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
    color: #fff;
    font-size: 0.95em;
  }

  .flags-list {
    flex: 1;
    padding: 8px 0;
    
    .flag-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: background 0.2s;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      .flag-item-icon {
        margin-top: 2px;
        flex-shrink: 0;
      }
      
      .flag-item-content {
        flex: 1;
        min-width: 0;
        
        .flag-item-title {
          font-weight: 500;
          font-size: 0.85em;
          margin-bottom: 2px;
          color: #fff;
        }
        
        .flag-item-note {
          color: #ccc;
          font-size: 0.8em;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .flag-item-meta {
          color: #999;
          font-size: 0.75em;
          display: flex;
          flex-direction: column;
          gap: 2px;
          
          .flag-date {
            font-size: 0.7em;
          }
        }
      }
      
      .flag-item-action {
        color: rgba(255, 255, 255, 0.7);
        flex-shrink: 0;
        
        &:hover {
          color: white;
        }
      }
    }
  }
}

/* Media Container Styles */
.media-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #000;

  &.image-container,
  &.video-container {
    .media-image,
    .media-video {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
  }

  &.audio-container {
    .audio-player {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: white;

      .audio-icon {
        margin-bottom: 24px;
        color: #666;
      }

      .audio-element {
        width: 400px;
        max-width: 90%;
      }
    }
  }

  &.pdf-container {
    background: #f5f5f5;
    flex-direction: column;

    .pdf-loading,
    .pdf-error {
      color: #666;
      text-align: center;
    }

    .pdf-display {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;

      .pdf-controls {
        background: white;
        padding: 12px 24px;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #333;

        .page-controls,
        .zoom-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-info,
        .zoom-info {
          font-weight: 500;
          min-width: 80px;
        }
      }

      .pdf-canvas-container {
        flex: 1;
        overflow: auto;
        padding: 20px;
        background: #e0e0e0;
        display: flex;
        justify-content: center;
        position: relative;

        .pdf-canvas {
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }

  &.unsupported-container {
    .unsupported-content {
      text-align: center;
      color: #666;
    }
  }
}

/* Flag Marker Styles */
.flag-marker {
  position: absolute;
  z-index: 999;
  cursor: pointer;

  .flag-icon {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.2);
    }

    &.clickable {
      cursor: pointer;
    }
  }

  &.flag-marker-pdf .flag-icon {
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }
}

/* Video Timeline Styles */
.video-timeline {
  position: absolute;
  bottom: 60px;
  left: 20px;
  right: 20px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  cursor: pointer;
  overflow: hidden;

  .timeline-progress {
    height: 100%;
    background: #1976d2;
    transition: width 0.1s;
  }

  .timeline-flag {
    position: absolute;
    cursor: pointer;
    
    .flag-icon {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
    }
  }
}

.flags-panel {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  max-height: 300px;
  min-width: 250px;
  overflow-y: auto;
  border-radius: 8px;
  
  .flags-expansion {
    background: transparent;
    color: inherit;
  }

  .flags-list {
    padding: 8px 0;
    
    .flag-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      &:last-child {
        border-bottom: none;
      }

      .flag-item-icon {
        margin-right: 12px;
        margin-top: 2px;
        flex-shrink: 0;
      }

      .flag-item-content {
        flex: 1;
        min-width: 0;

        .flag-item-title {
          font-weight: 500;
          font-size: 0.9em;
          margin-bottom: 2px;
        }

        .flag-item-note {
          color: #ccc;
          font-size: 0.8em;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .flag-item-meta {
          color: #999;
          font-size: 0.75em;
          display: flex;
          flex-direction: column;
          gap: 2px;
          
          .flag-date {
            font-size: 0.7em;
          }
        }
      }

      .flag-item-actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
  flex-shrink: 0;
  margin-left: 8px;
}
    }
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .flags-sidebar {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .viewer-layout {
    flex-direction: column;
  }
  
  .media-section {
    height: 70vh;
  }
  
  .flags-sidebar {
    width: 100%;
    height: 30vh;
    border-left: none;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .video-timeline {
    bottom: 40px;
    left: 10px;
    right: 10px;
    height: 30px;
  }
}
</style>