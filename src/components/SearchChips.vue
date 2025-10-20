<template>
  <div class="search-chips-container">
    <!-- Unified Voice Search Component -->
    <UnifiedVoiceSearch
      ref="searchInput"
      v-model="inputText"
      :placeholder="placeholder"
      :outlined="true"
      :dense="true"
      :voice-enabled="true"
      :keywords="availableKeywords"
      :auto-search="false"
      @search="handleEnterKeyPress"
      @voice-result="handleVoiceResult"
      class="search-input"
    >
      <!-- Search button in append slot -->
      <template v-slot:append>
        <q-btn
          round
          dense
          flat
          icon="search"
          @click="performSearch"
          :disable="keywords.length === 0"
          color="primary"
        >
          <q-tooltip>Search</q-tooltip>
        </q-btn>
      </template>
    </UnifiedVoiceSearch>

    <!-- Alternative layout: Chips outside input (uncomment if preferred) -->
    <div v-if="keywords.length > 0" class="chips-outside q-mt-sm">
      <q-chip
        v-for="(keyword, index) in keywords"
        :key="index"
        removable
        @remove="removeChip(index)"
        color="primary"
        text-color="white"
        class="q-ma-xs"
      >
        {{ keyword }}
      </q-chip>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import UnifiedVoiceSearch from './UnifiedVoiceSearch.vue'

export default defineComponent({
  name: 'SearchChips',

  components: {
    UnifiedVoiceSearch
  },

  props: {
    placeholder: {
      type: String,
      default: 'Enter search terms and press Enter...'
    },
    searchCallback: {
      type: Function,
      default: null
    },
    maxChips: {
      type: Number,
      default: 10
    },
    clearOnSearch: {
      type: Boolean,
      default: false
    },
    availableKeywords: {
      type: Array,
      default: () => ["Wing B", "201", "301", "Living Room", "Kitchen","2nd Floor","Master Bedroom","Bonding Coat Application","Wing A"],
    }
  },

  emits: ['search', 'chips-updated'],

  setup(props, { emit }) {
    const inputText = ref('')
    const keywords = ref([])
    const searchInput = ref(null)

    // Handle Enter key press from UnifiedVoiceSearch
    const handleEnterKeyPress = (query) => {
      if (!query || !query.trim()) return
      
      // Add the typed text as chip(s)
      addChipFromText(query.trim())
      
      // Clear the input text using the exposed method
      if (searchInput.value && searchInput.value.clearText) {
        searchInput.value.clearText()
      }
      inputText.value = ''
    }

    // Handle voice result from API
    const handleVoiceResult = (result) => {
      console.log('Voice result received:', result)
      
      // Get the processed text from API response
      const processedText = result.processed || result.original || ''
      
      // Check if the processed text contains commas
      if (processedText.includes(',')) {
        // Split by comma and create separate chips
        createChipsFromCommaSeparated(processedText)
      } else if (processedText.trim()) {
        // Single word/phrase - add as single chip
        addSingleChip(processedText.trim())
      }
      
      // Clear the input field - this will sync with UnifiedVoiceSearch via v-model
      inputText.value = ''
      
      // Could emit this to parent for additional processing
      emit('voice-result', result)
    }

    // Add chip from text (handles comma-separated values)
    const addChipFromText = (text) => {
      if (!text) return

      // Check if input contains comma-separated values
      if (text.includes(',')) {
        createChipsFromCommaSeparated(text)
      } else {
        // Single chip
        addSingleChip(text)
      }
    }

    const createChipsFromCommaSeparated = (text) => {
      // Split by comma and clean up each word
      const words = text.split(',')
        .map(word => word.trim())
        .filter(word => word.length > 0) // Remove empty strings
      
      // Add each word as a separate chip
      words.forEach(word => {
        addSingleChip(word)
      })
    }

    const addSingleChip = (text) => {
      const trimmedText = text.trim()

      if (!trimmedText) return

      // Prevent duplicates (case-insensitive)
      if (keywords.value.some(keyword =>
          keyword.toLowerCase() === trimmedText.toLowerCase())) {
        return
      }

      // Check max chips limit
      if (keywords.value.length >= props.maxChips) {
        console.warn(`Maximum ${props.maxChips} chips reached`)
        return
      }

      keywords.value.push(trimmedText)
      
      // Emit chips updated event
      emit('chips-updated', [...keywords.value])
      
      // Immediately trigger search when chip is added
      performSearch()
    }

    const removeChip = (index) => {
      keywords.value.splice(index, 1)
      emit('chips-updated', [...keywords.value])
      
      // Immediately trigger search when chip is removed
      performSearch()
    }

    const performSearch = () => {
      // Always emit search, even if no keywords (to show all results)
      const searchTerms = [...keywords.value]

      // Emit search event
      emit('search', searchTerms)

      // Call callback function if provided
      if (props.searchCallback && typeof props.searchCallback === 'function') {
        props.searchCallback(searchTerms)
      }

      // Clear chips if specified
      if (props.clearOnSearch) {
        clearAll()
      }
    }

    const clearAll = () => {
      keywords.value = []
      inputText.value = ''
      emit('chips-updated', [])
      
      // Trigger search to show all results when cleared
      emit('search', [])
    }

    const getKeywords = () => {
      return [...keywords.value]
    }

    const setKeywords = (newKeywords) => {
      keywords.value = [...newKeywords]
      emit('chips-updated', [...keywords.value])
      
      // Trigger search when keywords are set programmatically
      performSearch()
    }

    // Expose methods for parent components
    return {
      inputText,
      keywords,
      searchInput,
      removeChip,
      performSearch,
      clearAll,
      getKeywords,
      setKeywords,
      handleEnterKeyPress,
      handleVoiceResult,
      createChipsFromCommaSeparated,
      addSingleChip,
      addChipFromText
    }
  }
})
</script>

<style scoped>
.search-chips-container {
  width: 100%;
}

.search-input {
  width: 100%;
}

.chips-container {
  display: flex;
  flex-wrap: wrap;
  max-width: 300px; /* Adjust based on your needs */
  overflow-x: auto;
}

.chips-outside {
  display: flex;
  flex-wrap: wrap;
}
</style>