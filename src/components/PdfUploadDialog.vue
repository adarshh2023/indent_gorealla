<template>
  <q-dialog
    v-model="isOpen"
    persistent
    maximized
    transition-show="slide-up"
    transition-hide="slide-down"
    class="pdf-upload-dialog"
  >
    <q-card class="pdf-dialog-card">
      <!-- Header -->
      <q-card-section class="dialog-header">
        <div class="header-content">
          <div class="header-left">
            <q-icon name="picture_as_pdf" size="24px" class="q-mr-sm" />
            <div>
              <div class="text-h6">Add PDF Document</div>
              <div class="text-caption text-grey-6">
                {{ pdfFile?.name }}
                <span v-if="flags.length > 0"> • {{ flags.length }} flag(s) added</span>
                <span v-if="pdfPages > 0"> • {{ pdfPages }} page(s)</span>
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
        <div class="pdf-container">
          <!-- PDF Viewer Section -->
          <div class="pdf-viewer-section">
            <!-- PDF Loading -->
            <div v-if="isLoadingPdf" class="pdf-loading">
              <q-spinner-dots size="48px" color="primary" />
              <p class="text-grey-6 q-mt-md">Loading PDF...</p>
            </div>

            <!-- PDF Error -->
            <div v-else-if="pdfError" class="pdf-error">
              <q-icon name="error_outline" size="64px" color="negative" />
              <p class="text-h6 text-negative q-mt-md">Failed to load PDF</p>
              <p class="text-grey-6">{{ pdfError }}</p>
              <q-btn
                label="Try Again"
                color="primary"
                @click="loadPdf"
                class="q-mt-md"
              />
            </div>

            <!-- PDF Display using iframe -->
            <div v-else class="pdf-display">
              <!-- PDF Controls -->
              <div class="pdf-controls">
                <div class="page-controls">
                  <q-btn
                    icon="keyboard_arrow_left"
                    flat
                    round
                    @click="previousPage"
                    :disable="currentPage <= 1"
                  />
                  <span class="page-info">
                    Page {{ currentPage }} of {{ pdfPages }}
                  </span>
                  <q-btn
                    icon="keyboard_arrow_right"
                    flat
                    round
                    @click="nextPage"
                    :disable="currentPage >= pdfPages"
                  />
                </div>

                <div class="zoom-controls">
                  <q-btn
                    icon="zoom_out"
                    flat
                    round
                    @click="zoomOut"
                    :disable="zoomLevel <= 50"
                  />
                  <span class="zoom-info">{{ zoomLevel }}%</span>
                  <q-btn
                    icon="zoom_in"
                    flat
                    round
                    @click="zoomIn"
                    :disable="zoomLevel >= 200"
                  />
                  <q-btn
                    icon="fit_screen"
                    flat
                    round
                    @click="fitToWidth"
                  />
                </div>

                <div class="view-controls">
                  <q-btn
                    icon="refresh"
                    flat
                    round
                    @click="refreshPdf"
                    label="Refresh"
                  />
                </div>
              </div>

              <!-- PDF Container with Overlay for Flags -->
              <div class="pdf-iframe-container" ref="pdfContainer">
                <!-- PDF Iframe -->
                <iframe
                  ref="pdfIframe"
                  :src="pdfViewerUrl"
                  class="pdf-iframe"
                  frameborder="0"
                  @load="handlePdfLoad"
                ></iframe>

                <!-- Clickable Overlay for Flag Interaction -->
                <div class="pdf-click-overlay" @click="handlePdfClick"></div>

                <!-- Flag Overlay -->
                <div class="flag-overlay">
                  <!-- Flag Markers on PDF - EXACT SAME as CameraCaptureDialog -->
                  <div
                    v-for="flag in currentPageFlags"
                    :key="flag.id"
                    class="flag-marker-pdf"
                    :style="getPdfFlagStyle(flag)"
                    @click.stop="openFlagNotes(flag)"
                  >
                    <q-icon 
                      name="flag"
                      :color="flag.type"
                      size="24px"
                      class="flag-icon clickable"
                    />
                    <q-tooltip class="bg-white text-dark shadow-2">
                      {{ formatFlagType(flag.type) }} Flag
                      <div v-if="flag.note" class="text-caption q-mt-xs">{{ flag.note.substring(0, 50) }}...</div>
                    </q-tooltip>
                  </div>

                  <!-- Speed Dial for Flag Types - EXACT SAME as CameraCaptureDialog -->
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

                  <!-- Tap instruction -->
                  <div class="tap-instruction" v-if="!flags.length && !isLoadingPdf">
                    <q-icon name="touch_app" size="24px" />
                    <span>Tap anywhere to add flags</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Section -->
          <div class="form-section">
            <!-- Quick Actions -->
            <div class="quick-actions">
              <div class="section-title">
                <q-icon name="flash_on" class="q-mr-sm" />
                Quick Settings
              </div>
              <div class="action-chips">
                <q-chip
                  clickable
                  color="primary"
                  text-color="white"
                  icon="architecture"
                  @click="applyQuickSettings('blueprint')"
                >
                  Blueprint
                </q-chip>
                <q-chip
                  clickable
                  color="secondary"
                  text-color="white"
                  icon="description"
                  @click="applyQuickSettings('specification')"
                >
                  Specification
                </q-chip>
                <q-chip
                  clickable
                  color="accent"
                  text-color="white"
                  icon="assessment"
                  @click="applyQuickSettings('report')"
                >
                  Report
                </q-chip>
                <q-chip
                  clickable
                  color="negative"
                  text-color="white"
                  icon="report_problem"
                  @click="applyQuickSettings('issue')"
                >
                  Issue Document
                </q-chip>
              </div>
            </div>

            <!-- Flags List -->
            <div v-if="flags.length > 0" class="flags-list">
              <div class="section-title">
                <q-icon name="flag" class="q-mr-sm" />
                Flag Markers ({{ flags.length }})
              </div>
              <div class="flag-items">
                <q-item
                  v-for="flag in flags"
                  :key="flag.id"
                  clickable
                  class="flag-item"
                  :class="{ 'current-page-flag': flag.page === currentPage }"
                  @click="goToFlag(flag)"
                >
                  <q-item-section avatar>
                    <q-icon 
                      name="flag"
                      :color="flag.type"
                      size="20px"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ formatFlagType(flag.type) }} Flag</q-item-label>
                    <q-item-label caption>Page {{ flag.page }}</q-item-label>
                    <q-item-label caption v-if="flag.note">{{ flag.note.substring(0, 50) }}...</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="flag-actions">
                      <q-btn
                        icon="edit_note"
                        size="sm"
                        flat
                        round
                        @click.stop="openFlagNotes(flag)"
                      />
                      <q-btn
                        icon="visibility"
                        size="sm"
                        flat
                        round
                        color="primary"
                        @click.stop="showFlagNotesList = true; selectedFlag = flag; loadFlagNotes(flag.id)"
                        v-if="flag.note"
                      />
                      <q-btn
                        icon="delete"
                        size="sm"
                        flat
                        round
                        color="negative"
                        @click.stop="removeFlag(flag.id)"
                      />
                    </div>
                  </q-item-section>
                </q-item>
              </div>
            </div>

            <!-- PDF Form -->
            <q-form @submit="handleSave" class="pdf-form">
              <q-input
                v-model="formData.title"
                label="Title *"
                outlined
                dense
                :rules="[val => !!val || 'Title is required']"
                class="q-mb-md"
              />

              <q-input
                v-model="formData.description"
                label="Description"
                outlined
                dense
                type="textarea"
                rows="3"
                class="q-mb-md"
              />

              <q-select
                v-model="formData.mediaCategory"
                :options="categoryOptions"
                option-label="label"
                option-value="value"
                emit-value
                map-options
                label="Category"
                outlined
                dense
                class="q-mb-md"
              >
                <template v-slot:option="scope">
                  <q-item v-bind="scope.itemProps">
                    <q-item-section avatar>
                      <q-icon :name="scope.opt.icon" :color="scope.opt.color" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label>{{ scope.opt.label }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>

              <q-input
                v-model="tagsInput"
                label="Tags (comma separated)"
                outlined
                dense
                @blur="processTags"
                class="q-mb-md"
              />

              <div v-if="formData.tags.length > 0" class="tags-display q-mb-md">
                <q-chip
                  v-for="(tag, index) in formData.tags"
                  :key="index"
                  removable
                  color="grey-3"
                  text-color="dark"
                  @remove="removeTag(index)"
                  class="q-ma-xs"
                >
                  {{ tag }}
                </q-chip>
              </div>

              <q-toggle
                v-model="formData.isPublic"
                label="Visibility"
                color="positive"
                class="q-mb-md"
              />

              <div class="visibility-description q-mb-lg">
                <div class="visibility-indicator">
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
                  label="Cancel"
                  flat
                  @click="handleClose"
                />
                <q-btn
                  label="Save PDF"
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
            Page {{ selectedFlag?.page }} - Add notes for this flag marker
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

    <!-- Flag Notes List Modal -->
    <q-dialog v-model="showFlagNotesList" class="flag-notes-list-dialog">
      <q-card style="min-width: 500px; max-width: 700px;">
        <q-card-section>
          <div class="text-h6">
            {{ formatFlagType(selectedFlag?.type) }} Flag Notes
          </div>
          <div class="text-caption text-grey-6">
            Page {{ selectedFlag?.page }} - All notes for this flag marker
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section style="max-height: 500px" class="scroll">
          <div v-if="isLoadingFlagNotes" class="text-center q-pa-md">
            <q-spinner color="primary" size="md" />
            <p class="q-mt-sm text-grey-6">Loading notes...</p>
          </div>

          <div v-else-if="flagNotes.length === 0" class="text-center q-pa-lg">
            <q-icon name="note" size="48px" color="grey-5" />
            <p class="text-grey-6 q-mt-md">No notes found for this flag</p>
          </div>

          <div v-else>
            <q-list separator>
              <q-item
                v-for="note in flagNotes"
                :key="note.recCode"
                class="flag-note-item"
              >
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ note.subject }}
                  </q-item-label>
                  <q-item-label caption lines="3">
                    {{ note.noteContent }}
                  </q-item-label>
                  <q-item-label caption class="text-primary q-mt-xs">
                    By {{ note.createdByName }} • {{ formatDate(note.createdAt) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side v-if="note.mentions && note.mentions.length > 0">
                  <q-chip 
                    size="sm" 
                    color="info" 
                    text-color="white"
                    icon="alternate_email"
                  >
                    {{ note.mentions.length }}
                  </q-chip>
                </q-item-section>
              </q-item>
            </q-list>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn
            label="Add New Note"
            color="primary"
            icon="add_note"
            @click="showFlagNotesList = false; openFlagNotes(selectedFlag)"
          />
          <q-btn label="Close" flat v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useGalleryStore } from 'stores/gallery'
import { GALLERY_CATEGORIES } from 'src/utils/file'
import { showError, showSuccess } from 'src/utils/notification'
import { getCurrentUserId } from 'src/utils/auth'
import noteService from 'src/services/api/note.service'
import NoteEditor from './NoteEditor.vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  pdfFile: {
    type: File,
    required: true
  },
  nodeId: {
    type: String,
    required: true
  },
  projectUsers: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'saved',
  'close'
])

// Store
const galleryStore = useGalleryStore()

// Refs
const pdfContainer = ref(null)
const pdfIframe = ref(null)

// State
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isSaving = ref(false)
const isLoadingPdf = ref(false)
const pdfError = ref('')
const pdfViewerUrl = ref('')
const currentPage = ref(1)
const pdfPages = ref(0)
const zoomLevel = ref(100)

// Flag functionality - EXACT SAME as CameraCaptureDialog
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

// Enhanced flag notes data - EXACT SAME as CameraCaptureDialog
const flagNotes = ref([]) // Store notes for selected flag
const showFlagNotesList = ref(false) // Show notes list dialog
const isLoadingFlagNotes = ref(false) // Loading state

// Form data
const formData = ref({
  title: '',
  description: '',
  mediaCategory: GALLERY_CATEGORIES.BLUEPRINT,
  isPublic: true,
  sortOrder: 0,
  tags: []
})

const tagsInput = ref('')

// Options
const categoryOptions = [
  {
    label: 'Blueprint',
    value: GALLERY_CATEGORIES.BLUEPRINT,
    icon: 'architecture',
    color: 'primary'
  },
  {
    label: 'Progress',
    value: GALLERY_CATEGORIES.PROGRESS,
    icon: 'timeline',
    color: 'secondary'
  },
  {
    label: 'Issues',
    value: GALLERY_CATEGORIES.ISSUE,
    icon: 'report_problem',
    color: 'negative'
  },
  {
    label: 'Before',
    value: GALLERY_CATEGORIES.BEFORE,
    icon: 'schedule',
    color: 'info'
  },
  {
    label: 'After',
    value: GALLERY_CATEGORIES.AFTER,
    icon: 'check_circle',
    color: 'positive'
  }
]

// Computed
const canSave = computed(() => {
  return formData.value.title.trim() && props.pdfFile && !isSaving.value && !isLoadingPdf.value
})

const currentPageFlags = computed(() => {
  return flags.value.filter(flag => flag.page === currentPage.value)
})

// Flag Helper Functions - EXACT SAME as CameraCaptureDialog
// const getFlagIcon = (type) => {
//   return 'flag' // CameraCaptureDialog always uses 'flag' icon
// }

// const getFlagColor = (type) => {
//   // CameraCaptureDialog uses the type as the color directly
//   return type || 'primary'
// }

const formatFlagType = (type) => {
  return type?.charAt(0).toUpperCase() + type?.slice(1) || 'Unknown'
}

// Date formatter - EXACT SAME as CameraCaptureDialog
const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString()
  } catch (error) {
    console.log(error)
    return dateString
  }
}

// Load notes by flagId function - EXACT SAME as CameraCaptureDialog
const loadFlagNotes = async (flagId) => {
  if (!flagId) return
  
  isLoadingFlagNotes.value = true
  try {
    // Get all notes and filter by flagId
    const response = await noteService.getNodeNotes(props.nodeId)
    
    if (response.success && response.data) {
      // Filter notes that have the matching flagId
      const notesWithFlagId = response.data.content || response.data
      flagNotes.value = Array.isArray(notesWithFlagId) 
        ? notesWithFlagId.filter(note => 
            note.metadata && 
            note.metadata.flagId === flagId
          )
        : []
        
      console.log(`Loaded ${flagNotes.value.length} notes for flag ${flagId}`)
    } else {
      flagNotes.value = []
    }
  } catch (error) {
    console.error('Error loading flag notes:', error)
    flagNotes.value = []
    showError('Failed to load flag notes')
  } finally {
    isLoadingFlagNotes.value = false
  }
}

// PDF Methods - Using iframe approach to avoid PDF.js issues
const loadPdf = async () => {
  if (!props.pdfFile) return

  isLoadingPdf.value = true
  pdfError.value = ''

  try {
    console.log('Loading PDF using iframe approach...')
    
    // Create blob URL for the PDF file
    const pdfBlob = new Blob([props.pdfFile], { type: 'application/pdf' })
    const blobUrl = URL.createObjectURL(pdfBlob)
    
    // Create PDF viewer URL with controls
    pdfViewerUrl.value = `${blobUrl}#toolbar=1&navpanes=0&scrollbar=1&page=${currentPage.value}&zoom=${zoomLevel.value}`
    
    // Estimate pages (we'll update this when iframe loads if possible)
    pdfPages.value = 1
    
    console.log('PDF blob URL created:', blobUrl)
    console.log('PDF viewer URL:', pdfViewerUrl.value)
    
    isLoadingPdf.value = false
    
  } catch (error) {
    console.error('Error loading PDF:', error)
    pdfError.value = `Failed to load PDF: ${error.message}`
    isLoadingPdf.value = false
  }
}

const handlePdfLoad = () => {
  console.log('PDF iframe loaded successfully')
}

const refreshPdf = () => {
  if (pdfViewerUrl.value) {
    const baseUrl = pdfViewerUrl.value.split('#')[0]
    pdfViewerUrl.value = `${baseUrl}#toolbar=1&navpanes=0&scrollbar=1&page=${currentPage.value}&zoom=${zoomLevel.value}&t=${Date.now()}`
  }
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    updatePdfViewer()
  }
}

const nextPage = () => {
  currentPage.value++
  updatePdfViewer()
  
  if (currentPage.value > pdfPages.value) {
    pdfPages.value = currentPage.value
  }
}

const zoomIn = () => {
  if (zoomLevel.value < 200) {
    zoomLevel.value += 25
    updatePdfViewer()
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 50) {
    zoomLevel.value -= 25
    updatePdfViewer()
  }
}

const fitToWidth = () => {
  zoomLevel.value = 100
  updatePdfViewer()
}

const updatePdfViewer = () => {
  if (pdfViewerUrl.value) {
    const baseUrl = pdfViewerUrl.value.split('#')[0]
    pdfViewerUrl.value = `${baseUrl}#toolbar=1&navpanes=0&scrollbar=1&page=${currentPage.value}&zoom=${zoomLevel.value}`
  }
}

// Flag Methods - EXACT SAME as CameraCaptureDialog
const handlePdfClick = (event) => {
  const containerRect = pdfContainer.value.getBoundingClientRect()
  const containerX = event.clientX - containerRect.left
  const containerY = event.clientY - containerRect.top

  speedDialPosition.value = { x: containerX, y: containerY }
  showFlagSpeedDial.value = true
}

const hideFlagSpeedDial = () => {
  showFlagSpeedDial.value = false
}

const addFlag = (type) => {
  if (!pdfContainer.value) return

  // Check if user is authenticated - EXACT SAME as CameraCaptureDialog
  const currentUserId = getCurrentUserId()
  if (!currentUserId) {
    showError('User not authenticated')
    return
  }

  const containerRect = pdfContainer.value.getBoundingClientRect()
  
  // Convert to relative coordinates (0-1 scale)
  const relativeX = speedDialPosition.value.x / containerRect.width
  const relativeY = speedDialPosition.value.y / containerRect.height

  // Ensure coordinates are within bounds
  if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) {
    showError('Please tap on the PDF to add a flag')
    hideFlagSpeedDial()
    return
  }

  // EXACT SAME structure as CameraCaptureDialog
  const flag = {
    id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: type,
    page: currentPage.value, // PDF specific - add page number
    position: {
      x: relativeX,
      y: relativeY
    },
    note: '',
    userId: currentUserId,
    createdAt: new Date().toISOString()
  }
  
  flags.value.push(flag)
  hideFlagSpeedDial()
  showSuccess(`${formatFlagType(type)} flag added to page ${currentPage.value}`)
}

const getPdfFlagStyle = (flag) => {
  if (!flag.position || !pdfContainer.value) {
    return { display: 'none' }
  }

  const containerRect = pdfContainer.value.getBoundingClientRect()
  
  // Convert relative coordinates back to absolute for current display
  const displayX = flag.position.x * containerRect.width
  const displayY = flag.position.y * containerRect.height

  return {
    position: 'absolute',
    left: `${displayX}px`,
    top: `${displayY}px`,
    zIndex: 999,
    transform: 'translate(-50%, -50%)'
  }
}

const removeFlag = (flagId) => {
  const index = flags.value.findIndex(f => f.id === flagId)
  if (index > -1) {
    const flag = flags.value[index]
    flags.value.splice(index, 1)
    showSuccess(`Flag removed from page ${flag.page}`)
  }
}

const goToFlag = (flag) => {
  if (flag.page !== currentPage.value) {
    currentPage.value = flag.page
    updatePdfViewer()
  }
  // Highlight the flag briefly
  nextTick(() => {
    selectedFlag.value = flag
    setTimeout(() => {
      if (selectedFlag.value === flag) {
        selectedFlag.value = null
      }
    }, 2000)
  })
}

// Flag Notes Methods - EXACT SAME as CameraCaptureDialog
const openFlagNotes = async (flag) => {
  selectedFlag.value = flag
  flagNoteData.value = {
    subject: `${formatFlagType(flag.type)} Flag Note - Page ${flag.page}`,
    noteContent: flag.note || '',
    mentions: []
  }
  showFlagNotesModal.value = true

  // Load existing notes for this flag
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
    if (!selectedFlag.value || !props.nodeId) return

    // Get current user ID - EXACT SAME as CameraCaptureDialog
    const currentUserId = getCurrentUserId()
    if (!currentUserId) {
      showError('User not authenticated')
      return
    }

    // Process note data for backend compatibility - EXACT SAME as CameraCaptureDialog
    const apiNoteData = noteService.processNoteForBackend({
      ...noteData,
      nodeId: props.nodeId,
      nodeGalleryId: null, // PDF doesn't have gallery ID yet
      flagId: selectedFlag.value.id,
      flagType: selectedFlag.value.type,
      flagPage: selectedFlag.value.page, // PDF specific
      metadata: {
        flagId: selectedFlag.value.id,
        flagType: selectedFlag.value.type,
        flagPage: selectedFlag.value.page,
        flagPosition: selectedFlag.value.position
      }
    })

    console.log('Saving flag note with data:', apiNoteData)

    // Save note using noteService - EXACT SAME as CameraCaptureDialog
    const response = await noteService.createNote(apiNoteData)

    if (response.success) {
      // Update flag with note content
      selectedFlag.value.note = noteData.noteContent
      showSuccess('Flag note saved successfully')
      
      // Reload notes for this flag
      await loadFlagNotes(selectedFlag.value.id)
    } else {
      throw new Error(response.message || 'Failed to save note')
    }

    closeFlagNotes()
  } catch (error) {
    console.error('Error saving flag note:', error)
    showError('Failed to save flag note: ' + error.message)
  }
}

// Form Methods
const initializeForm = () => {
  const fileName = props.pdfFile?.name || 'PDF Document'
  const nameWithoutExtension = fileName.replace(/\.[^/.]+$/, '')
  
  formData.value = {
    title: nameWithoutExtension,
    description: '',
    mediaCategory: GALLERY_CATEGORIES.BLUEPRINT,
    isPublic: true,
    sortOrder: 0,
    tags: []
  }
  
  flags.value = []
  tagsInput.value = ''
}

const applyQuickSettings = (type) => {
  switch (type) {
    case 'blueprint':
      formData.value.mediaCategory = GALLERY_CATEGORIES.BLUEPRINT
      formData.value.tags = ['blueprint', 'plan']
      break
    case 'specification':
      formData.value.mediaCategory = GALLERY_CATEGORIES.BLUEPRINT
      formData.value.tags = ['specification', 'requirements']
      break
    case 'report':
      formData.value.mediaCategory = GALLERY_CATEGORIES.PROGRESS
      formData.value.tags = ['report', 'documentation']
      break
    case 'issue':
      formData.value.mediaCategory = GALLERY_CATEGORIES.ISSUE
      formData.value.tags = ['issue', 'problem']
      formData.value.isPublic = false
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
  if (!canSave.value) return

  isSaving.value = true

  try {
    // Prepare upload data with flags in metadata - EXACT SAME structure as CameraCaptureDialog
    const uploadData = {
      nodeId: props.nodeId,
      mediaCategory: formData.value.mediaCategory,
      isPublic: formData.value.isPublic,
      sortOrder: formData.value.sortOrder,
      caption: formData.value.description.trim(),
      metadata: {
        title: formData.value.title.trim(),
        tags: formData.value.tags.join(','),
        uploadedAt: new Date().toISOString(),
        totalPages: pdfPages.value,
        flags: flags.value.map(flag => ({
          id: flag.id,
          type: flag.type,
          page: flag.page, // PDF specific
          position: {
            x: flag.position.x,
            y: flag.position.y
          },
          note: flag.note,
          userId: flag.userId,
          createdAt: flag.createdAt
        }))
      }
    }

    // Upload using gallery store
    const result = await galleryStore.uploadSingleFile(props.pdfFile, uploadData)

    if (result.results && result.results.length > 0) {
      showSuccess('PDF uploaded successfully')
      emit('saved', result.results[0])
      handleClose()
    } else {
      throw new Error('Upload failed - no result returned')
    }

  } catch (error) {
    console.error('PDF upload save error:', error)
    showError('Failed to save PDF: ' + error.message)
  } finally {
    isSaving.value = false
  }
}

const handleClose = () => {
  // Clean up blob URL to prevent memory leaks
  if (pdfViewerUrl.value && pdfViewerUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(pdfViewerUrl.value.split('#')[0])
  }
  emit('close')
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    initializeForm()
    nextTick(() => {
      loadPdf()
    })
  }
})

watch(() => props.pdfFile, (newFile) => {
  if (newFile && props.modelValue) {
    initializeForm()
    nextTick(() => {
      loadPdf()
    })
  }
})

// Lifecycle
onMounted(() => {
  if (props.modelValue && props.pdfFile) {
    initializeForm()
    nextTick(() => {
      loadPdf()
    })
  }
})

onUnmounted(() => {
  // Clean up blob URL
  if (pdfViewerUrl.value && pdfViewerUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(pdfViewerUrl.value.split('#')[0])
  }
})
</script>

<style lang="scss" scoped>
.pdf-upload-dialog {
  .pdf-dialog-card {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
}

.dialog-header {
  background: linear-gradient(135deg, #673ab7 0%, #512da8 100%);
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

.dialog-content {
  flex: 1;
  overflow: hidden;
  padding: 0;
}

.pdf-container {
  display: flex;
  height: 100%;
}

.pdf-viewer-section {
  flex: 2;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.pdf-loading,
.pdf-error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.pdf-display {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pdf-controls {
  background: white;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;

  .page-controls,
  .zoom-controls,
  .view-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .page-info,
  .zoom-info {
    font-weight: 500;
    min-width: 80px;
    text-align: center;
  }
}

.pdf-iframe-container {
  flex: 1;
  position: relative;
  overflow: hidden;

  .pdf-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: white;
  }

  .pdf-click-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    cursor: crosshair;
    background: transparent;
  }

  .flag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 10;

    .flag-marker-pdf {
      pointer-events: all;
      cursor: pointer;
      
      .flag-icon {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          transform: scale(1.2);
        }

        &.clickable {
          cursor: pointer;
        }
      }
    }

    .q-fab {
      pointer-events: all;
    }

    .tap-instruction {
      position: absolute;
      bottom: 20px;
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
      pointer-events: none;
    }
  }
}

.form-section {
  flex: 1;
  background: white;
  border-left: 1px solid #e0e0e0;
  overflow-y: auto;
  padding: 24px;
  max-width: 400px;
}

.quick-actions {
  margin-bottom: 32px;

  .section-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    color: #424242;
  }

  .action-chips {
    display: flex;
    flex-direction: column;
    gap: 8px;

    .q-chip {
      justify-content: flex-start;
    }
  }
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
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #e0e0e0;
    border-radius: 8px;

    .flag-item {
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      &.current-page-flag {
        background: rgba(103, 58, 183, 0.1);
      }

      .flag-actions {
        display: flex;
        gap: 4px;
      }
    }
  }
}

.pdf-form {
  .form-actions {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 24px;
  }
}

.tags-display {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.visibility-description {
  background: rgba(0, 0, 0, 0.05);
  padding: 12px;
  border-radius: 8px;

  .visibility-indicator {
    display: flex;
    align-items: center;
  }
}

// Flag Notes List Dialog Styles
.flag-notes-list-dialog {
  .flag-note-item {
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 8px;
    background: rgba(0, 0, 0, 0.02);

    &:hover {
      background: rgba(0, 0, 0, 0.05);
    }
  }
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

// Responsive design
@media (max-width: 768px) {
  .pdf-container {
    flex-direction: column;
  }

  .form-section {
    max-width: none;
    border-left: none;
    border-top: 1px solid #e0e0e0;
  }

  .pdf-controls {
    .page-controls,
    .zoom-controls,
    .view-controls {
      justify-content: center;
      flex-wrap: wrap;
    }
  }

  .quick-actions {
    .action-chips {
      flex-direction: row;
      flex-wrap: wrap;

      .q-chip {
        flex: 1;
        min-width: 120px;
        justify-content: center;
      }
    }
  }

  .flags-list {
    .flag-items {
      max-height: 200px;
    }
  }
}

@media (max-width: 480px) {
  .dialog-header {
    padding: 16px;
  }

  .form-section {
    padding: 16px;
  }

  .pdf-iframe-container {
    .flag-overlay {
      .tap-instruction {
        font-size: 12px;
        padding: 6px 12px;
      }
    }
  }

  .quick-actions {
    margin-bottom: 20px;

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
      max-height: 150px;
    }
  }

  .pdf-form {
    .form-actions {
      flex-direction: column;
      gap: 8px;

      .q-btn {
        width: 100%;
      }
    }
  }
}

// Dark mode support
.body--dark {
  .form-section {
    background: #1e1e1e;
    color: #e0e0e0;
  }

  .flag-items {
    background: #2a2a2a;
    border-color: #444;
  }

  .pdf-controls {
    background: #2a2a2a;
    color: #e0e0e0;
    border-color: #444;
  }

  .visibility-description {
    background: rgba(255, 255, 255, 0.1);
  }

  .flag-notes-list-dialog {
    .flag-note-item {
      background: rgba(255, 255, 255, 0.05);

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

// Accessibility improvements
.flag-icon {
  &:focus {
    outline: 2px solid #673ab7;
    outline-offset: 2px;
    border-radius: 50%;
  }
}

// Mobile touch improvements
@media (hover: none) and (pointer: coarse) {
  .flag-marker-pdf {
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
}

// Enhanced flag highlighting
.flag-item.current-page-flag {
  animation: highlightCurrentPage 0.3s ease-out;
}

@keyframes highlightCurrentPage {
  0% {
    background: rgba(103, 58, 183, 0.3);
  }
  100% {
    background: rgba(103, 58, 183, 0.1);
  }
}

// Flag animations
.flag-marker-pdf {
  &.current-flag {
    animation: pulseFlag 1s ease-in-out;
  }
}

@keyframes pulseFlag {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
  }
}

// Iframe specific styles
.pdf-iframe-container {
  &::-webkit-scrollbar {
    display: none;
  }
  
  // For Firefox
  scrollbar-width: none;
}

// Tooltip improvements
.q-tooltip {
  font-size: 12px;
  max-width: 200px;
  word-wrap: break-word;
}

// Speed dial improvements
.q-fab {
  .q-fab__actions {
    .q-fab__action {
      margin: 8px 0;
    }
  }
}
</style>