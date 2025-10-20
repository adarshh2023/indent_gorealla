<template>
  <div class="gallery-tab">
    <!-- Gallery Toolbar -->
    <div class="gallery-toolbar">
      <div class="toolbar-left">
        <!-- Camera Button (Mobile Only) -->
        <q-btn
          v-if="isNativePlatform"
          color="secondary"
          icon="photo_camera"
          label="Camera"
          size="sm"
          @click="openCameraOptions"
          class="q-mr-sm"
        />

        <!-- Upload Button -->
        <q-btn
          color="primary"
          icon="cloud_upload"
          size="sm"
          @click="triggerFileUpload"
          :loading="galleryStore.uploading"
        />

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          style="display: none"
          @change="handleFileSelection"
        />

        <!-- View Mode Toggle -->
        <q-btn-toggle
          v-model="viewMode"
          toggle-color="primary"
          :options="[
            { icon: 'grid_view', value: 'grid', slot: 'grid' },
            { icon: 'view_list', value: 'list', slot: 'list' }
          ]"
          size="sm"
          class="q-ml-sm"
        />
      </div>

      <div class="toolbar-right">
        <!-- Search -->
        <q-input
          v-model="searchTerm"
          placeholder="Search files..."
          dense
          outlined
          style="min-width: 200px"
          @update:model-value="handleSearch"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
          <template v-slot:append>
            <q-icon
              v-if="searchTerm"
              name="clear"
              class="cursor-pointer"
              @click="clearSearch"
            />
          </template>
        </q-input>

        <!-- Filters -->
        <q-btn
          icon="filter_list"
          label="Filters"
          size="sm"
          flat
          @click="showFilters = !showFilters"
          class="q-ml-sm"
        />
      </div>
    </div>

    <!-- Selection Bar -->
    <div v-if="isSelectionMode" class="selection-bar">
      <div class="selection-info">
        <q-checkbox
          :model-value="isAllSelected"
          @update:model-value="toggleSelectAll"
          indeterminate-value="some"
          color="primary"
        />
        <span class="q-ml-sm">{{ selectedItemsCount }} selected</span>
      </div>

      <div class="selection-actions">
        <q-btn
          icon="folder"
          label="Category"
          size="sm"
          flat
          @click="showCategoryDialog = true"
        />
        <q-btn
          icon="visibility"
          label="Make Public"
          size="sm"
          flat
          @click="bulkUpdateVisibility(true)"
        />
        <q-btn
          icon="visibility_off"
          label="Make Private"
          size="sm"
          flat
          @click="bulkUpdateVisibility(false)"
        />
        <q-btn
          icon="delete"
          label="Delete"
          size="sm"
          flat
          color="negative"
          @click="confirmBulkDelete"
        />
        <q-btn
          icon="close"
          size="sm"
          flat
          @click="clearSelection"
        />
      </div>
    </div>

    <!-- Upload Progress -->
    <div v-if="galleryStore.uploading" class="upload-progress">
      <q-linear-progress
        :value="galleryStore.uploadProgress / 100"
        color="primary"
        size="4px"
      />
      <div class="upload-info">
        <span>Uploading... {{ galleryStore.uploadProgress }}%</span>
      </div>
    </div>

    <!-- Filters Panel -->
    <q-slide-transition>
      <div v-show="showFilters" class="filters-panel">
        <div class="filters-content">
          <div class="filter-group">
            <q-select
              v-model="galleryStore.filters.mediaType"
              :options="mediaTypeOptions"
              label="File Type"
              emit-value
              map-options
              clearable
              dense
              outlined
              style="min-width: 150px"
            />
          </div>

          <div class="filter-group">
            <q-select
              v-model="galleryStore.filters.category"
              :options="categoryOptions"
              label="Category"
              emit-value
              map-options
              clearable
              dense
              outlined
              style="min-width: 150px"
            />
          </div>

          <div class="filter-group">
            <q-select
              v-model="galleryStore.filters.visibility"
              :options="visibilityOptions"
              label="Visibility"
              emit-value
              map-options
              clearable
              dense
              outlined
              style="min-width: 150px"
            />
          </div>

          <div class="filter-group">
            <q-input
              v-model="dateRange"
              label="Date Range"
              dense
              outlined
              readonly
              style="min-width: 200px"
            >
              <template v-slot:append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="dateRange"
                      range
                      @update:model-value="handleDateRangeChange"
                    />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="filter-actions">
            <q-btn
              label="Clear All"
              size="sm"
              flat
              @click="clearAllFilters"
            />
          </div>
        </div>
      </div>
    </q-slide-transition>

    <!-- Gallery Content -->
    <div
      class="gallery-content"
      :class="{ 'drag-over': isDragOver }"
      @dragover.prevent="handleDragOver"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @drop.prevent="handleDrop"
    >
      <!-- Loading State -->
      <div v-if="galleryStore.loading" class="loading-state">
        <q-spinner-dots size="48px" color="primary" />
        <p class="text-grey-6 q-mt-md">Loading gallery...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredItems.length === 0 && !searchTerm && !hasActiveFilters" class="empty-state">
        <q-icon name="photo_library" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-6 q-mt-md">No files uploaded yet</p>
        <p class="text-grey-5">
          {{ isNativePlatform ? 'Take photos, record videos or upload files to get started' : 'Drag & drop files or click upload to get started' }}
        </p>
        <div class="empty-actions q-mt-lg">
          <q-btn
            v-if="isNativePlatform"
            color="secondary"
            icon="photo_camera"
            label="Take Photo"
            @click="openCameraOptions"
            class="q-mr-sm"
          />
          <q-btn
            color="primary"
            icon="cloud_upload"
            label="Upload Files"
            @click="triggerFileUpload"
          />
        </div>
      </div>

      <!-- No Results -->
      <div v-else-if="filteredItems.length === 0" class="empty-state">
        <q-icon name="search_off" size="64px" color="grey-5" />
        <p class="text-h6 text-grey-6 q-mt-md">No files found</p>
        <p class="text-grey-5">Try adjusting your search or filters</p>
        <div class="empty-actions q-mt-lg">
          <q-btn
            icon="clear"
            label="Clear Filters"
            flat
            @click="clearAllFilters"
          />
        </div>
      </div>

      <!-- Gallery Grid/List -->
      <div v-else class="gallery-view" :class="`gallery-${viewMode}`">
        <div
          v-for="item in filteredItems"
          :key="item.recCode"
          class="gallery-item-wrapper"
        >
          <GalleryItem
            :item="item"
            :view-mode="viewMode"
            :selected="selectedItems.includes(item.recCode)"
            @click="handleItemClick"
            @select="handleItemSelect"
            @view="handleItemView"
            @download="handleItemDownload"
            @delete="handleItemDelete"
            @edit="handleItemEdit"
          />
        </div>
      </div>

      <!-- Load More -->
      <div v-if="hasMoreItems" class="load-more-container">
        <q-btn
          color="primary"
          flat
          icon="keyboard_arrow_down"
          label="Load More"
          @click="loadMore"
          :loading="galleryStore.loading"
          class="full-width"
        />
      </div>

      <!-- Drag Over Overlay -->
      <div v-if="isDragOver" class="drag-overlay">
        <div class="drag-content">
          <q-icon name="cloud_upload" size="64px" color="primary" />
          <p class="text-h6 text-primary q-mt-md">Drop files to upload</p>
        </div>
      </div>
    </div>

    <!-- Category Selection Dialog -->
    <q-dialog v-model="showCategoryDialog">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Select Category</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-option-group
            v-model="selectedCategory"
            :options="categoryOptions.filter(opt => opt.value !== null)"
            color="primary"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn
            color="primary"
            label="Apply"
            @click="bulkUpdateCategory"
            :disable="!selectedCategory"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Camera Options Dialog -->
    <q-dialog v-model="showCameraOptions">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Camera Options</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list>
            <!-- Take Photo -->
            <q-item clickable v-close-popup @click="captureFromCamera">
              <q-item-section avatar>
                <q-icon name="photo_camera" color="primary" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Take Photo</q-item-label>
                <q-item-label caption>Capture a new photo</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <!-- Record Video -->
            <q-item clickable v-close-popup @click="recordVideo">
              <q-item-section avatar>
                <q-icon name="videocam" color="negative" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Record Video</q-item-label>
                <q-item-label caption>Record video with flag markers</q-item-label>
              </q-item-section>
            </q-item>

            <q-separator />

            <!-- Photo Library -->
            <q-item clickable v-close-popup @click="captureFromGallery">
              <q-item-section avatar>
                <q-icon name="photo_library" color="accent" />
              </q-item-section>
              <q-item-section>
                <q-item-label>Photo Library</q-item-label>
                <q-item-label caption>Choose from gallery</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Media Viewer -->
    <MediaViewer
  v-if="showMediaViewer"
  v-model="showMediaViewer"
  :item="selectedViewItem"
  :project-users="projectUsers"
  @navigate="handleViewerNavigate"
  @close="handleViewerClose"
  @delete="handleItemDelete"
  @edit="handleItemEdit"
/>

    <!-- Edit Media Dialog -->
    <EditMediaDialog
  v-if="showEditDialog"
  v-model="showEditDialog"
  :item="selectedEditItem"
  :project-users="projectUsers"  
  @saved="handleItemUpdated"
  @close="handleEditClose"
/>
    <!-- Camera Capture Dialog -->
    <CameraCaptureDialog
  v-if="showCameraCaptureDialog"
  v-model="showCameraCaptureDialog"
  :image-data="capturedImageData"
  :node-id="props.nodeId"
  :project-users="projectUsers"
  @saved="handleCameraCaptureSaved"
  @close="handleCameraCaptureClose"
/>

    <!-- Video Recording Dialog -->
    <VideoRecordingDialog
  v-if="showVideoRecordingDialog"
  v-model="showVideoRecordingDialog"
  :node-id="nodeId"
  :project-users="projectUsers"
  @saved="handleVideoSaved"
  @close="handleVideoRecordingClose"
/>

    <!-- PDF Upload Dialog -->
    <PdfUploadDialog
  v-if="showPdfUploadDialog"
  v-model="showPdfUploadDialog"
  :pdf-file="selectedPdfFile"
  :node-id="props.nodeId"
  :project-users="projectUsers"
  @saved="handlePdfSaved"
  @close="handlePdfUploadClose"
/>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useGalleryStore } from 'stores/gallery'
import { GALLERY_MEDIA_TYPES, GALLERY_CATEGORIES } from 'src/utils/file'
import { showError, showSuccess, showConfirm } from 'src/utils/notification'
import { Capacitor } from '@capacitor/core'
import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera'
import GalleryItem from './GalleryItem.vue'
import MediaViewer from './MediaViewer.vue'
import EditMediaDialog from './EditMediaDialog.vue'
import CameraCaptureDialog from './CameraCaptureDialog.vue'
import VideoRecordingDialog from './VideoRecordingDialog.vue'
import PdfUploadDialog from './PdfUploadDialog.vue'

// Props
const props = defineProps({
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

// Store
const galleryStore = useGalleryStore()

// Refs
const fileInput = ref(null)
const viewMode = ref('grid')
const searchTerm = ref('')
const searchTimeout = ref(null)
const isDragOver = ref(false)
const dragCounter = ref(0)
const showFilters = ref(false)
const dateRange = ref('')

// Dialog states
const showCategoryDialog = ref(false)
const showMediaViewer = ref(false)
const showEditDialog = ref(false)
const showCameraOptions = ref(false)
const showCameraCaptureDialog = ref(false)
const showVideoRecordingDialog = ref(false)
const showPdfUploadDialog = ref(false)
const selectedCategory = ref(null)
const selectedViewItem = ref(null)
const selectedEditItem = ref(null)
const capturedImageData = ref(null)
const selectedPdfFile = ref(null)

// Selection
const selectedItems = ref([])

// Platform detection
const isNativePlatform = computed(() => Capacitor.isNativePlatform())

// Options
const mediaTypeOptions = [
  { label: 'All Types', value: null, icon: 'all_inclusive' },
  { label: 'Images', value: GALLERY_MEDIA_TYPES.IMAGE, icon: 'image' },
  { label: 'Videos', value: GALLERY_MEDIA_TYPES.VIDEO, icon: 'videocam' },
  { label: 'Audio', value: GALLERY_MEDIA_TYPES.AUDIO, icon: 'audiotrack' },
  { label: 'Documents', value: GALLERY_MEDIA_TYPES.DOCUMENT, icon: 'description' },
  { label: 'PDFs', value: GALLERY_MEDIA_TYPES.PDF, icon: 'picture_as_pdf' }
]

const categoryOptions = [
  { label: 'All Categories', value: null, icon: 'all_inclusive' },
  { label: 'Progress', value: GALLERY_CATEGORIES.PROGRESS, icon: 'timeline' },
  { label: 'Issues', value: GALLERY_CATEGORIES.ISSUE, icon: 'report_problem' },
  { label: 'Before', value: GALLERY_CATEGORIES.BEFORE, icon: 'schedule' },
  { label: 'After', value: GALLERY_CATEGORIES.AFTER, icon: 'check_circle' },
  { label: 'Blueprint', value: GALLERY_CATEGORIES.BLUEPRINT, icon: 'architecture' }
]

const visibilityOptions = [
  { label: 'All', value: null },
  { label: 'Public', value: true },
  { label: 'Private', value: false }
]

// Computed
const filteredItems = computed(() => galleryStore.filteredItems)
const hasMoreItems = computed(() => galleryStore.hasMoreItems)
const hasActiveFilters = computed(() => galleryStore.hasActiveFilters)
const isSelectionMode = computed(() => selectedItems.value.length > 0)
const selectedItemsCount = computed(() => selectedItems.value.length)
const isAllSelected = computed(() => {
  if (filteredItems.value.length === 0) return false
  if (selectedItems.value.length === filteredItems.value.length) return true
  if (selectedItems.value.length > 0) return 'some'
  return false
})

// Helper function to detect PDF files
const isPdfFile = (file) => {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
}

// Camera methods
const openCameraOptions = () => {
  showCameraOptions.value = true
}

const captureFromCamera = async () => {
  try {
    const direction = CameraDirection.Back // or Front based on preference
    
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      direction: direction === 'front' ? CameraDirection.Front : CameraDirection.Back
    })

    capturedImageData.value = {
      dataUrl: image.dataUrl,
      format: image.format,
      source: 'camera',
      direction: direction
    }

    showCameraCaptureDialog.value = true
  } catch (error) {
    console.error('Camera capture error:', error)
    if (error.message !== 'User cancelled photos app') {
      showError('Failed to capture photo')
    }
  }
}

const captureFromGallery = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos
    })

    capturedImageData.value = {
      dataUrl: image.dataUrl,
      format: image.format,
      source: 'gallery',
      direction: null
    }

    showCameraCaptureDialog.value = true
  } catch (error) {
    console.error('Gallery selection error:', error)
    if (error.message !== 'User cancelled photos app') {
      showError('Failed to select photo')
    }
  }
}

// Video recording method
const recordVideo = () => {
  showVideoRecordingDialog.value = true
}

// File handling with PDF support
const triggerFileUpload = () => {
  fileInput.value?.click()
}

const handleFileSelection = (event) => {
  const files = Array.from(event.target.files)
  if (files.length > 0) {
    processFiles(files)
  }
  // Reset input
  event.target.value = ''
}

const processFiles = async (files) => {
  const pdfFiles = files.filter(file => isPdfFile(file))
  const otherFiles = files.filter(file => !isPdfFile(file))

  // Handle PDF files with flag marking
  if (pdfFiles.length === 1) {
    selectedPdfFile.value = pdfFiles[0]
    showPdfUploadDialog.value = true
  } else if (pdfFiles.length > 1) {
    // For multiple PDFs, ask user which one to mark with flags
    showError('Please select one PDF at a time for flag marking')
    return
  }

  // Handle other files normally
  if (otherFiles.length > 0) {
    uploadFiles(otherFiles)
  }
}

const uploadFiles = async (files) => {
  try {
    await galleryStore.uploadFiles(files, {
      nodeId: props.nodeId,
      mediaCategory: GALLERY_CATEGORIES.PROGRESS,
      isPublic: true,
      sortOrder: 0
    })
    
    showSuccess(`${files.length} file(s) uploaded successfully`)
  } catch (error) {
    showError('Failed to upload files')
    console.error('Upload error:', error)
  }
}

// Search and filters
const handleSearch = (value) => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }

  searchTimeout.value = setTimeout(() => {
    galleryStore.setFilter('searchTerm', value)
  }, 300)
}

const clearSearch = () => {
  searchTerm.value = ''
  galleryStore.setFilter('searchTerm', '')
}

const handleDateRangeChange = (value) => {
  galleryStore.setFilter('dateRange', value)
}

const clearAllFilters = () => {
  searchTerm.value = ''
  dateRange.value = ''
  galleryStore.clearAllFilters()
}

const loadMore = () => {
  galleryStore.loadMoreItems()
}

// Selection methods
const handleItemSelect = (itemId) => {
  const index = selectedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(itemId)
  }
}

const toggleSelectAll = (value) => {
  if (value === true) {
    selectedItems.value = [...filteredItems.value.map(item => item.recCode)]
  } else {
    selectedItems.value = []
  }
}

const clearSelection = () => {
  selectedItems.value = []
}

// Item actions
const handleItemClick = (item) => {
  if (isSelectionMode.value) {
    handleItemSelect(item.recCode)
  } else {
    handleItemView(item)
  }
}

const handleItemView = (item) => {
  selectedViewItem.value = item
  showMediaViewer.value = true
}

const handleItemEdit = (item) => {
  selectedEditItem.value = item
  showEditDialog.value = true
}

const handleItemDownload = (item) => {
  galleryStore.downloadItem(item)
}

const handleItemDelete = async (item) => {
  const confirmed = await showConfirm(
    'Delete File',
    `Are you sure you want to delete "${item.originalFileName}"?`,
    'Delete'
  )
  
  if (confirmed) {
    await galleryStore.deleteItem(item.recCode)
  }
}

const handleItemUpdated = () => {
  galleryStore.refreshGallery()
  showSuccess('File updated successfully')
}

// Bulk actions
const bulkUpdateCategory = async () => {
  try {
    await galleryStore.bulkUpdateCategory(selectedItems.value, selectedCategory.value)
    clearSelection()
    showSuccess('Category updated successfully')
  } catch (error) {
    showError('Failed to update category'+error)
  }
}

const bulkUpdateVisibility = async (isPublic) => {
  try {
    await galleryStore.bulkUpdateVisibility(selectedItems.value, isPublic)
    clearSelection()
    showSuccess('Visibility updated successfully')
  } catch (error) {
    showError('Failed to update visibility'+error)
  }
}

const confirmBulkDelete = async () => {
  const confirmed = await showConfirm(
    'Delete Files',
    `Are you sure you want to delete ${selectedItemsCount.value} file(s)?`,
    'Delete'
  )

  if (confirmed) {
    try {
      await galleryStore.bulkDelete([...selectedItems.value])
      clearSelection()
      showSuccess('Files deleted successfully')
    } catch (error) {
      showError('Failed to delete files'+error)
    }
  }
}

// Drag and Drop
const handleDragOver = (e) => {
  e.dataTransfer.dropEffect = 'copy'
}

const handleDragEnter = () => {
  dragCounter.value++
  isDragOver.value = true
}

const handleDragLeave = () => {
  dragCounter.value--
  if (dragCounter.value <= 0) {
    isDragOver.value = false
    dragCounter.value = 0
  }
}

const handleDrop = (e) => {
  isDragOver.value = false
  dragCounter.value = 0

  const files = Array.from(e.dataTransfer.files)
  if (files.length > 0) {
    processFiles(files)
  }
}

// Media Viewer
const handleViewerNavigate = (direction) => {
  const currentIndex = filteredItems.value.findIndex(item => item.recCode === selectedViewItem.value.recCode)
  let newIndex

  if (direction === 'next') {
    newIndex = currentIndex + 1
    if (newIndex >= filteredItems.value.length) newIndex = 0
  } else {
    newIndex = currentIndex - 1
    if (newIndex < 0) newIndex = filteredItems.value.length - 1
  }

  selectedViewItem.value = filteredItems.value[newIndex]
}

const handleViewerClose = () => {
  showMediaViewer.value = false
  selectedViewItem.value = null
}

const handleEditClose = () => {
  showEditDialog.value = false
  selectedEditItem.value = null
}

// Camera capture handlers
const handleCameraCaptureSaved = () => {
  showCameraCaptureDialog.value = false
  capturedImageData.value = null
  galleryStore.refreshGallery()
  showSuccess('Photo saved successfully')
}

const handleCameraCaptureClose = () => {
  showCameraCaptureDialog.value = false
  capturedImageData.value = null
}

// Video recording handlers
const handleVideoSaved = () => {
  showVideoRecordingDialog.value = false
  galleryStore.refreshGallery()
  showSuccess('Video saved successfully')
}

const handleVideoRecordingClose = () => {
  showVideoRecordingDialog.value = false
}

// PDF upload handlers
const handlePdfSaved = () => {
  showPdfUploadDialog.value = false
  selectedPdfFile.value = null
  galleryStore.refreshGallery()
  showSuccess('PDF saved successfully')
}

const handlePdfUploadClose = () => {
  showPdfUploadDialog.value = false
  selectedPdfFile.value = null
}

// Lifecycle
onMounted(async () => {
  galleryStore.setCurrentNode(props.nodeId)
  await galleryStore.loadGallery()
  await galleryStore.loadGallerySummary()
})

onUnmounted(() => {
  if (searchTimeout.value) {
    clearTimeout(searchTimeout.value)
  }
})

// Watch for node changes
watch(() => props.nodeId, async (newNodeId) => {
  if (newNodeId) {
    galleryStore.setCurrentNode(newNodeId)
    await galleryStore.loadGallery()
    await galleryStore.loadGallerySummary()
  }
})
</script>

<style lang="scss" scoped>
.gallery-tab {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gallery-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  background: white;
  flex-shrink: 0;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 8px; // Add consistent gap between buttons
    flex-wrap: wrap; // Allow wrapping if needed
  }

  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
}

.selection-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(25, 118, 210, 0.1);
  border-bottom: 1px solid rgba(25, 118, 210, 0.2);
  flex-shrink: 0;

  .selection-info {
    display: flex;
    align-items: center;
    color: #1976d2;
    font-weight: 500;
  }

  .selection-actions {
    display: flex;
    gap: 8px;
  }
}

.upload-progress {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;

  .upload-info {
    padding: 8px 16px;
    font-size: 12px;
    color: #666;
    text-align: center;
  }
}

.filters-panel {
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  flex-shrink: 0;

  .filters-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    flex-wrap: wrap;

    .filter-group {
      display: flex;
      align-items: center;
    }

    .filter-actions {
      margin-left: auto;
    }
  }
}

.gallery-content {
  flex: 1;
  position: relative;
  overflow-y: auto;
  padding: 16px;

  &.drag-over {
    background: rgba(25, 118, 210, 0.05);
    border: 2px dashed #1976d2;
  }
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: #666;

  .empty-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }
}

.gallery-toolbar .q-btn {
  white-space: nowrap; // Prevent text wrapping in buttons
}

.q-btn-toggle {
  flex-shrink: 0; // Prevent shrinking
}

.gallery-view {
  &.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  &.gallery-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.gallery-item-wrapper {
  position: relative;
}

.load-more-container {
  display: flex;
  justify-content: center;
  padding: 24px 0;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(25, 118, 210, 0.1);
  border: 3px dashed #1976d2;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;

  .drag-content {
    text-align: center;
    color: #1976d2;
  }
}

// Responsive design
@media (max-width: 768px) {
  .gallery-toolbar {
    padding: 12px;
    // Remove flex-direction: column to keep horizontal layout
    gap: 12px;
    
    .toolbar-left,
    .toolbar-right {
      // Remove justify-content: center to maintain natural alignment
      flex-wrap: wrap;
      gap: 8px;
    }
    
    // Make search input responsive
    .toolbar-right {
      .q-input {
        min-width: 150px !important;
        flex: 1;
      }
    }
  }

  // Only stack vertically on very small screens
  @media (max-width: 480px) {
    .gallery-toolbar {
      flex-direction: column;
      align-items: stretch;
      
      .toolbar-left,
      .toolbar-right {
        justify-content: center;
        width: 100%;
      }
      
      .toolbar-right {
        .q-input {
          min-width: 100% !important;
        }
      }
    }
  }
}

// Enhanced upload button styling
.toolbar-left {
  .q-btn {
    transition: all 0.2s ease;
    min-width: auto; // Prevent buttons from stretching unnecessarily

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
  }
}

// Loading animation
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.gallery-item-wrapper {
  animation: fadeIn 0.3s ease-out;
}

// Drag and drop enhancements
.gallery-content {
  transition: all 0.2s ease;

  &.drag-over {
    transform: scale(0.98);
  }
}

// Filter panel animations
.filters-panel {
  transition: all 0.3s ease;
}

// Selection mode styling
.gallery-item-wrapper {
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
  }
}

// Upload progress styling
.upload-progress {
  .q-linear-progress {
    border-radius: 0;
  }

  .upload-info {
    background: white;
    font-weight: 500;
  }
}
</style>