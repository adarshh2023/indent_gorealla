<template>
  <q-page padding>
    <div class="all-media-container">
      <!-- Header -->
      <div class="row items-center q-col-gutter-md q-mb-lg">
        <!-- Project Selection -->
        <div class="col-12 col-md-3">
          <q-select
            v-model="selectedProject"
            :options="projectOptions"
            option-label="nodeName"
            option-value="recCode"
            label="Select Project"
            filled
            dense
            emit-value
            map-options
            @update:model-value="onProjectChange"
          >
            <template v-slot:prepend>
              <q-icon name="business" />
            </template>
          </q-select>
        </div>

        <!-- Depth Control -->
        <div class="col-12 col-md-2">
          <q-select
            v-model="selectedDepth"
            :options="depthOptions"
            label="Scope"
            filled
            dense
            emit-value
            map-options
            @update:model-value="onDepthChange"
          >
            <template v-slot:prepend>
              <q-icon name="account_tree" />
            </template>
          </q-select>
        </div>

        <!-- Search Bar -->
        <div class="col-12 col-md-5">
          <q-input
            v-model="searchQuery"
            label="Search media..."
            filled
            dense
            debounce="300"
            @update:model-value="onSearchChange"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
            <template v-slot:append>
              <q-icon 
                v-if="searchQuery" 
                name="clear" 
                class="cursor-pointer" 
                @click="clearSearch" 
              />
            </template>
          </q-input>
        </div>

        <!-- Media Type Filter -->
        <div class="col-12 col-md-2">
          <div class="media-type-filters">
            <q-btn-toggle
              v-model="selectedMediaType"
              spread
              no-caps
              :options="mediaTypeOptions"
              @update:model-value="onMediaTypeChange"
            />
          </div>
        </div>
      </div>

      <!-- Stats Summary -->
      <div v-if="selectedProject && !isLoading" class="row q-col-gutter-md q-mb-lg">
        <div class="col-12">
          <q-card flat bordered class="bg-grey-1">
            <q-card-section horizontal class="items-center">
              <q-card-section class="text-center q-pa-md">
                <div class="text-h4 text-primary">{{ totalElements }}</div>
                <div class="text-caption text-grey-6">Total {{ selectedMediaType.toLowerCase() }} files</div>
              </q-card-section>
              <q-separator vertical />
              <q-card-section class="text-center q-pa-md">
                <div class="text-h6 text-secondary">{{ uniqueNodesCount }}</div>
                <div class="text-caption text-grey-6">Nodes with media</div>
              </q-card-section>
              <q-separator vertical />
              <q-card-section class="text-center q-pa-md">
                <div class="text-body1 text-grey-8">{{ depthLabel }}</div>
                <div class="text-caption text-grey-6">Current scope</div>
              </q-card-section>
              <q-card-section class="col">
                <div class="text-right">
                  <q-btn
                    flat
                    round
                    icon="refresh"
                    @click="refreshData"
                    :loading="isLoading"
                  >
                    <q-tooltip>Refresh</q-tooltip>
                  </q-btn>
                </div>
              </q-card-section>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center q-py-xl">
        <q-spinner-ios color="primary" size="50px" />
        <div class="q-mt-md text-grey-6">Loading media...</div>
      </div>

      <!-- No Project Selected -->
      <div v-else-if="!selectedProject" class="text-center q-py-xl">
        <q-icon name="business" size="80px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">Select a project to view media</div>
        <div class="text-grey-5">Choose a project from the dropdown above to explore its media files</div>
      </div>

      <!-- No Media Found -->
      <div v-else-if="groupedMedia.length === 0 && !isLoading" class="text-center q-py-xl">
        <q-icon :name="getMediaTypeIcon(selectedMediaType)" size="80px" color="grey-4" />
        <div class="text-h6 text-grey-6 q-mt-md">
          No {{ selectedMediaType.toLowerCase() }} files found
        </div>
        <div class="text-grey-5">
          {{ searchQuery ? 'Try adjusting your search query or scope' : 'Upload some media files to get started' }}
        </div>
      </div>

      <!-- Media Gallery -->
      <div v-else class="media-gallery">
        <!-- Date Groups -->
        <div
          v-for="(group) in groupedMedia"
          :key="group.date"
          class="date-group q-mb-xl"
          :ref="el => setDateGroupRef(el, group.date)"
        >
          <!-- Date Header -->
          <div class="date-header q-mb-md">
            <div class="row items-center">
              <div class="col">
                <h6 class="text-h6 text-grey-8 q-ma-none">{{ group.dateLabel }}</h6>
                <div class="text-caption text-grey-6">
                  {{ group.items.length }} {{ pluralize('item', group.items.length) }}
                  from {{ group.uniqueNodes }} {{ pluralize('node', group.uniqueNodes) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Media Grid -->
          <div class="media-grid">
            <div
              v-for="media in group.items"
              :key="media.recCode"
              class="media-item"
              @click="openMediaViewer(media)"
            >
              <!-- Image Preview -->
              <div v-if="media.mediaType === 'Image'" class="media-preview image-preview">
                <q-img
                  :src="media.thumbnailUrl || media.fileUrl"
                  :alt="media.originalFileName"
                  fit="cover"
                  loading="lazy"
                  class="full-width full-height cursor-pointer"
                  @error="handleImageError"
                >
                  <template v-slot:loading>
                    <div class="absolute-full flex flex-center">
                      <q-spinner-ios color="white" size="20px" />
                    </div>
                  </template>
                </q-img>
              </div>

              <!-- Video Preview -->
              <div v-else-if="media.mediaType === 'Video'" class="media-preview video-preview cursor-pointer">
                <div class="video-thumbnail">
                  <q-img
                    v-if="media.thumbnailUrl"
                    :src="media.thumbnailUrl"
                    fit="cover"
                    class="full-width full-height"
                  />
                  <div v-else class="video-placeholder">
                    <q-icon name="videocam" size="40px" color="white" />
                  </div>
                  <div class="video-overlay">
                    <q-icon name="play_circle_filled" size="30px" color="white" />
                  </div>
                </div>
              </div>

              <!-- Document Preview -->
              <div v-else class="media-preview document-preview cursor-pointer">
                <div class="document-icon">
                  <q-icon :name="getDocumentIcon(media)" size="40px" color="primary" />
                </div>
                <div class="document-name">{{ media.originalFileName }}</div>
              </div>

              <!-- Node Badge -->
              <div class="node-badge">
                <q-chip
                  dense
                  square
                  color="primary"
                  text-color="white"
                  size="sm"
                  :label="media.nodeName"
                />
              </div>

              <!-- More Options Button -->
              <div class="more-options-btn">
                <q-btn
                  round
                  flat
                  dense
                  icon="more_vert"
                  color="white"
                  size="sm"
                  @click.stop="showMoreOptions($event, media)"
                >
                  <q-tooltip>More options</q-tooltip>
                </q-btn>
              </div>

              <!-- Media Info Overlay -->
              <div class="media-overlay">
                <div class="media-title">{{ media.originalFileName }}</div>
                <div class="media-meta">
                  <span class="media-size">{{ formatFileSize(media.fileSize) }}</span>
                  <span class="media-date">{{ formatRelativeDate(media.uploadedDate) }}</span>
                </div>
                <div class="media-node">
                  <q-icon name="folder" size="12px" />
                  {{ media.nodeName }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Load More -->
        <div v-if="hasMoreItems" class="text-center q-py-lg">
          <q-btn
            color="primary"
            outline
            :loading="isLoadingMore"
            @click="loadMoreItems"
          >
            Load More
          </q-btn>
        </div>
      </div>

      <!-- Floating Date Indicator -->
      <div v-if="showDateIndicator" class="date-indicator">
        {{ currentDateLabel }}
      </div>

      <!-- More Options Menu -->
      <q-menu
        v-model="showMoreOptionsMenu"
        :target="moreOptionsTarget"
        anchor="top right"
        self="top left"
        auto-close
      >
        <q-list style="min-width: 180px">
          <q-item clickable v-close-popup @click="openMediaViewer(selectedMediaForOptions)">
            <q-item-section avatar>
              <q-icon :name="getMediaTypeIcon(selectedMediaForOptions?.mediaType)" />
            </q-item-section>
            <q-item-section>
              <q-item-label>View Media</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="openNodeProperties(selectedMediaForOptions)">
            <q-item-section avatar>
              <q-icon name="settings" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Node Properties</q-item-label>
              <q-item-label caption>{{ selectedMediaForOptions?.nodeName }}</q-item-label>
            </q-item-section>
          </q-item>

          <q-separator />

          <q-item clickable v-close-popup @click="downloadMedia(selectedMediaForOptions)">
            <q-item-section avatar>
              <q-icon name="download" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Download</q-item-label>
            </q-item-section>
          </q-item>

          <q-item clickable v-close-popup @click="copyMediaLink(selectedMediaForOptions)">
            <q-item-section avatar>
              <q-icon name="link" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Copy Link</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-menu>

      <!-- Media Viewer Dialog -->
      <MediaViewer
        v-if="showMediaViewer"
        v-model="showMediaViewer"
        :item="selectedViewerItem"
        :items="flatMediaItems"
        @navigate="handleViewerNavigate"
        @close="handleViewerClose"
        @delete="handleMediaDelete"
        @edit="handleMediaEdit"
      />
      
      <EditMediaDialog
        v-if="showEditDialog"
        v-model="showEditDialog"
        :item="selectedEditItem"
        @saved="handleMediaUpdate"
        @close="handleEditClose"
      />

      <!-- Project Node Properties Dialog -->
      <ProjectNodeProperties
        v-if="selectedMediaForDetails"
        v-model="showNodeProperties"
        :node-id="selectedMediaForDetails.nodeId"
        :node-name="selectedMediaForDetails.nodeName || 'Media Node'"
        :node-type="selectedMediaForDetails.nodeType || 'Node'"
        :node-type-id="selectedMediaForDetails.nodeTypeId"
        :node-icon="selectedMediaForDetails.nodeIcon || 'folder'"
        :icon-color="selectedMediaForDetails.iconColor || 'primary'"
        :completion-percentage="selectedMediaForDetails.completionPercentage || 0"
        :initial-tab="'gallery'"
        @node-updated="handleNodeUpdated"
      />

    </div>
    
  </q-page>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { date, copyToClipboard } from 'quasar'
import projectService from 'src/services/api/project.service'
import galleryService from 'src/services/api/gallery.service'
import ProjectNodeProperties from 'src/components/ProjectNodeProperties.vue'
import MediaViewer from 'src/components/MediaViewer.vue'
// import { GALLERY_MEDIA_TYPES } from 'src/utils/file'
import { showError, showSuccess } from 'src/utils/notification'
import EditMediaDialog from 'src/components/EditMediaDialog.vue'


export default {
  name: 'AllMediaPage',

components: {
  ProjectNodeProperties,
  MediaViewer,
  EditMediaDialog  // ADD THIS
},

  setup() {
    const route = useRoute()

    // Reactive data
    const selectedProject = ref(null)
    const projectOptions = ref([])
    const searchQuery = ref('')
    const selectedMediaType = ref('Image')
    const selectedDepth = ref(-1) // Default: all descendants
    const allMedia = ref([])
    const isLoading = ref(false)
    const isLoadingMore = ref(false)
    const hasMoreItems = ref(true)
    const currentPage = ref(0) // API uses 0-based indexing
    const pageSize = ref(50)
    const totalElements = ref(0)

    // Date indicator
    const showDateIndicator = ref(false)
    const currentDateLabel = ref('')
    const dateGroupRefs = ref(new Map())

    // Media viewer
    const showMediaViewer = ref(false)
    const selectedViewerItem = ref(null)

    // More options menu
    const showMoreOptionsMenu = ref(false)
    const moreOptionsTarget = ref(null)
    const selectedMediaForOptions = ref(null)

    // Node properties
    const showNodeProperties = ref(false)
    const selectedMediaForDetails = ref(null)

    const showEditDialog = ref(false)
    const selectedEditItem = ref(null)

    // Depth options for hierarchical control
    const depthOptions = [
      { label: 'This Node Only', value: 0 },
      { label: '1 Level Deep', value: 1 },
      { label: '2 Levels Deep', value: 2 },
      { label: '3 Levels Deep', value: 3 },
      { label: 'All Descendants', value: -1 }
    ]

    // Media type options
    const mediaTypeOptions = [
      { label: 'Images', value: 'Image', icon: 'image' },
      { label: 'Videos', value: 'Video', icon: 'videocam' },
      { label: 'Documents', value: 'Document', icon: 'description' }
    ]

    // Computed
    const groupedMedia = computed(() => {
      if (!allMedia.value.length) return []

      const groups = {}
      
      allMedia.value.forEach(media => {
        const uploadDate = new Date(media.uploadedDate)
        const dateKey = date.formatDate(uploadDate, 'YYYY-MM-DD')
        
        if (!groups[dateKey]) {
          groups[dateKey] = {
            date: dateKey,
            dateLabel: formatDateGroupLabel(uploadDate),
            items: [],
            uniqueNodes: new Set()
          }
        }
        
        groups[dateKey].items.push(media)
        groups[dateKey].uniqueNodes.add(media.nodeId)
      })

      // Convert uniqueNodes Set to count and sort by date (newest first)
      return Object.values(groups)
        .map(group => ({
          ...group,
          uniqueNodes: group.uniqueNodes.size
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    const flatMediaItems = computed(() => {
      // Flatten all media items for viewer navigation
      return allMedia.value
    })

    const uniqueNodesCount = computed(() => {
      const uniqueNodes = new Set(allMedia.value.map(media => media.nodeId))
      return uniqueNodes.size
    })

    const depthLabel = computed(() => {
      const option = depthOptions.find(opt => opt.value === selectedDepth.value)
      return option ? option.label : 'All Descendants'
    })

    // Methods - Add the new hierarchical gallery service method
    const addHierarchicalGalleryMethod = () => {
      // Add this method to gallery service if not exists
      if (!galleryService.getNodeHierarchicalGallery) {
        galleryService.getNodeHierarchicalGallery = async (nodeId, params = {}) => {
          const queryParams = {
            depth: params.depth !== undefined ? params.depth : -1,
            page: params.page || 0,
            size: params.size || 20,
            sort: params.sort || 'uploadedDate,desc'
          }

          // Add optional filters
          if (params.mediaType) {
            queryParams.mediaType = params.mediaType
          }
          if (params.mediaCategory) {
            queryParams.mediaCategory = params.mediaCategory
          }

          const response = await galleryService.api.get(`/gallery/node/${nodeId}/hierarchical`, {
            params: queryParams
          })
          return response
        }
      }
    }

    const loadProjects = async () => {
      try {
        const response = await projectService.getAllProjects()
        if (response.success) {
          projectOptions.value = response.data.content || []
          
          // Auto-select from query parameter
          const projectId = route.query.project
          if (projectId && projectOptions.value.find(p => p.recCode === projectId)) {
            selectedProject.value = projectId
            await loadMediaForProject()
          }
        }
      } catch (error) {
        showError('Failed to load projects')
        console.error(error)
      }
    }

    const loadMediaForProject = async (reset = true) => {
      if (!selectedProject.value) return

      try {
        if (reset) {
          isLoading.value = true
          allMedia.value = []
          currentPage.value = 0
          hasMoreItems.value = true
          totalElements.value = 0
        } else {
          isLoadingMore.value = true
        }

        // Prepare API parameters
        const params = {
          depth: selectedDepth.value,
          mediaType: selectedMediaType.value,
          page: currentPage.value,
          size: pageSize.value,
          sort: 'uploadedDate,desc'
        }

        let response
        if (searchQuery.value.trim()) {
          // For search, we'll need to implement search in the hierarchical endpoint
          // For now, let's use the existing search and filter client-side
          response = await galleryService.searchGallery(
            selectedProject.value,
            searchQuery.value,
            params
          )
        } else {
          // Use the new hierarchical API
          response = await galleryService.getNodeHierarchicalGallery(
            selectedProject.value,
            params
          )
        }

        if (response.success) {
          const newMedia = response.data.content || []
          totalElements.value = response.data.totalElements || 0
          
          if (reset) {
            allMedia.value = newMedia
          } else {
            allMedia.value.push(...newMedia)
          }

          hasMoreItems.value = !response.data.last
          
          if (!reset && newMedia.length > 0) {
            currentPage.value++
          }
        }
      } catch (error) {
        showError('Failed to load media')
        console.error(error)
      } finally {
        isLoading.value = false
        isLoadingMore.value = false
      }
    }

    const onProjectChange = async () => {
      if (selectedProject.value) {
        await loadMediaForProject()
      } else {
        allMedia.value = []
        totalElements.value = 0
      }
    }

    const onDepthChange = async () => {
      if (selectedProject.value) {
        await loadMediaForProject()
      }
    }

    const onMediaTypeChange = async () => {
      if (selectedProject.value) {
        await loadMediaForProject()
      }
    }

    const onSearchChange = async () => {
      if (selectedProject.value) {
        await loadMediaForProject()
      }
    }

    const clearSearch = () => {
      searchQuery.value = ''
      if (selectedProject.value) {
        loadMediaForProject()
      }
    }

    const refreshData = async () => {
      if (selectedProject.value) {
        await loadMediaForProject()
      }
    }

    const loadMoreItems = async () => {
      currentPage.value++
      await loadMediaForProject(false)
    }

    // Media viewer methods
    const openMediaViewer = (media) => {
      selectedViewerItem.value = media
      showMediaViewer.value = true
    }

    const handleViewerNavigate = (newItem) => {
      selectedViewerItem.value = newItem
    }

    const handleViewerClose = () => {
      showMediaViewer.value = false
      selectedViewerItem.value = null
    }

    const handleMediaDelete = (item) => {
      // Remove from local array
      const index = allMedia.value.findIndex(media => media.recCode === item.recCode)
      if (index !== -1) {
        allMedia.value.splice(index, 1)
        totalElements.value--
      }
      showSuccess('Media deleted successfully')
    }

    const handleMediaEdit = (item) => {
  selectedEditItem.value = item
  showEditDialog.value = true
}

const handleEditClose = () => {
      showEditDialog.value = false
      selectedEditItem.value = null
    }

const handleMediaUpdate = async (updatedItem) => {
  // Update the item in the local array
  const index = allMedia.value.findIndex(media => media.recCode === updatedItem.recCode)
  if (index !== -1) {
    allMedia.value[index] = updatedItem
  }
  showSuccess('Media updated successfully')
  showEditDialog.value = false
  selectedEditItem.value = null
}

    // More options methods
    const showMoreOptions = (event, media) => {
      selectedMediaForOptions.value = media
      moreOptionsTarget.value = event.currentTarget
      showMoreOptionsMenu.value = true
    }

    const openNodeProperties = async (media) => {
      // We already have the node name from the hierarchical API response
      selectedMediaForDetails.value = {
        ...media,
        nodeType: 'Node',
        nodeIcon: 'folder',
        iconColor: 'primary',
        completionPercentage: 0
      }
      showNodeProperties.value = true
    }

    const downloadMedia = (media) => {
      if (media.fileUrl) {
        const link = document.createElement('a')
        link.href = media.fileUrl
        link.download = media.originalFileName || media.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        showSuccess('Download started')
      }
    }

    const copyMediaLink = async (media) => {
      if (media.fileUrl) {
        try {
          await copyToClipboard(media.fileUrl)
          showSuccess('Link copied to clipboard')
        } catch (error) {
          console.error('Failed to copy link:', error)
          showError('Failed to copy link')
        }
      }
    }

    const handleNodeUpdated = () => {
      // Optionally refresh media list
      if (selectedProject.value) {
        loadMediaForProject()
      }
    }

    // Utility methods (same as before)
    const formatDateGroupLabel = (dateObj) => {
      const now = new Date()
      const today = date.formatDate(now, 'YYYY-MM-DD')
      const yesterday = date.formatDate(date.subtractFromDate(now, { days: 1 }), 'YYYY-MM-DD')
      const mediaDate = date.formatDate(dateObj, 'YYYY-MM-DD')

      if (mediaDate === today) {
        return 'Today'
      } else if (mediaDate === yesterday) {
        return 'Yesterday'
      } else if (date.getDateDiff(now, dateObj, 'days') <= 7) {
        return date.formatDate(dateObj, 'dddd')
      } else if (date.isSameDate(now, dateObj, 'year')) {
        return date.formatDate(dateObj, 'MMMM D')
      } else {
        return date.formatDate(dateObj, 'MMMM D, YYYY')
      }
    }

    const formatRelativeDate = (dateStr) => {
      const mediaDate = new Date(dateStr)
      const now = new Date()
      const diffMs = now - mediaDate
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      
      return date.formatDate(mediaDate, 'MMM D')
    }

    const formatFileSize = (bytes) => {
      if (!bytes || bytes === 0) return '0 B'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const getMediaTypeIcon = (type) => {
      const iconMap = {
        'Image': 'image',
        'Video': 'videocam',
        'Document': 'description'
      }
      return iconMap[type] || 'description'
    }

    const getDocumentIcon = (media) => {
      if (media.mimeType === 'application/pdf') return 'picture_as_pdf'
      if (media.mimeType?.includes('word')) return 'description'
      if (media.mimeType?.includes('excel') || media.mimeType?.includes('spreadsheet')) return 'table_chart'
      if (media.mimeType?.includes('powerpoint') || media.mimeType?.includes('presentation')) return 'slideshow'
      return 'description'
    }

    const pluralize = (word, count) => {
      return count === 1 ? word : word + 's'
    }

    const handleImageError = (event) => {
      console.warn('Failed to load image:', event)
    }

    const setDateGroupRef = (el, dateKey) => {
      if (el) {
        dateGroupRefs.value.set(dateKey, el)
      }
    }

    // Scroll handling for date indicator
    const handleScroll = () => {
      // const scrollY = window.scrollY
      let currentDate = ''
      
      for (const [dateKey, element] of dateGroupRefs.value.entries()) {
        if (element) {
          const rect = element.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom > 100) {
            currentDate = dateKey
            break
          }
        }
      }

      if (currentDate) {
        currentDateLabel.value = formatDateGroupLabel(new Date(currentDate))
        showDateIndicator.value = true
      } else {
        showDateIndicator.value = false
      }
    }

    // Lifecycle
    onMounted(async () => {
      addHierarchicalGalleryMethod() // Add the new API method
      await loadProjects()
      window.addEventListener('scroll', handleScroll)
    })

    onBeforeUnmount(() => {
      window.removeEventListener('scroll', handleScroll)
    })

    return {
      // Reactive data
      selectedProject,
      projectOptions,
      searchQuery,
      selectedMediaType,
      selectedDepth,
      allMedia,
      isLoading,
      isLoadingMore,
      hasMoreItems,
      totalElements,
      showDateIndicator,
      currentDateLabel,
      showMediaViewer,
      selectedViewerItem,
      showMoreOptionsMenu,
      moreOptionsTarget,
      selectedMediaForOptions,
      showNodeProperties,
      selectedMediaForDetails,
      mediaTypeOptions,
      depthOptions,

      // Computed
      groupedMedia,
      flatMediaItems,
      uniqueNodesCount,
      depthLabel,

      // Methods
      onProjectChange,
      onDepthChange,
      onMediaTypeChange,
      onSearchChange,
      clearSearch,
      refreshData,
      loadMoreItems,
      openMediaViewer,
      handleViewerNavigate,
      handleViewerClose,
      handleMediaDelete,
      handleMediaEdit,
      handleEditClose,
      handleMediaUpdate,
      showMoreOptions,
      openNodeProperties,
      downloadMedia,
      copyMediaLink,
      handleNodeUpdated,
      formatDateGroupLabel,
      formatRelativeDate,
      formatFileSize,
      getMediaTypeIcon,
      getDocumentIcon,
      pluralize,
      handleImageError,
      setDateGroupRef
    }
  }
}
</script>

<style lang="scss" scoped>
.all-media-container {
  max-width: 1400px;
  margin: 0 auto;
}

.media-gallery {
  position: relative;
}

.date-group {
  .date-header {
    padding: 16px 0 8px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  }
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.media-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f5f5;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    
    .media-overlay {
      opacity: 1;
    }
    
    .more-options-btn {
      opacity: 1;
    }
  }
}

.media-preview {
  width: 100%;
  height: 100%;
  position: relative;
  
  &.image-preview {
    .q-img {
      border-radius: 12px;
    }
  }
  
  &.video-preview {
    .video-thumbnail {
      position: relative;
      width: 100%;
      height: 100%;
      
      .video-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .video-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        opacity: 0.9;
      }
    }
  }
  
  &.document-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    
    .document-icon {
      margin-bottom: 12px;
    }
    
    .document-name {
      font-size: 12px;
      text-align: center;
      color: #666;
      line-height: 1.3;
      max-height: 2.6em;
      overflow: hidden;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
  }
}

.node-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  
  .q-chip {
    font-size: 10px;
    max-width: calc(100% - 50px); // Leave space for more options button
    
    :deep(.q-chip__content) {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.more-options-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .q-btn {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    
    &:hover {
      background: rgba(0, 0, 0, 0.7);
    }
  }
}

.media-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 20px 12px 12px;
  opacity: 0;
  transition: opacity 0.2s ease;
  
  .media-title {
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .media-meta {
    font-size: 11px;
    opacity: 0.9;
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  
  .media-node {
    font-size: 10px;
    opacity: 0.8;
    display: flex;
    align-items: center;
    gap: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.date-indicator {
  position: fixed;
  top: 80px;
  right: 24px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1000;
  backdrop-filter: blur(10px);
}

// Responsive design
@media (max-width: 768px) {
  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
  
  .media-item {
    border-radius: 8px;
  }
  
  .node-badge {
    .q-chip {
      font-size: 8px;
      max-width: calc(100% - 40px); // Adjust for smaller screen
    }
  }
  
  .more-options-btn {
    opacity: 1; // Always show on mobile
    
    .q-btn {
      padding: 4px;
    }
  }
  
  .date-indicator {
    top: 60px;
    right: 16px;
    font-size: 12px;
    padding: 6px 12px;
  }
}

@media (max-width: 480px) {
  .media-grid {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 8px;
  }
  
  .node-badge {
    .q-chip {
      font-size: 8px;
      max-width: calc(100% - 35px);
    }
  }
  
  .more-options-btn {
    top: 6px;
    right: 6px;
  }
}

// Touch device improvements
@media (hover: none) {
  .media-item {
    .media-overlay {
      opacity: 1;
    }
    
    .more-options-btn {
      opacity: 1;
    }
  }
}

// Focus styles for accessibility
.media-item {
  &:focus-visible {
    outline: 2px solid #1976d2;
    outline-offset: 2px;
  }
}

.more-options-btn .q-btn {
  &:focus-visible {
    outline: 2px solid #ffffff;
    outline-offset: 2px;
  }
}
</style>