import { create } from 'zustand'
import {
  ingestDocuments,
  createChunks,
  buildIndex,
  semanticSearch,
  generateAnswer,
} from './api'

export const STEP_IDS = ['upload', 'chunk', 'index', 'search', 'generate']

export const STEP_META = {
  upload: { title: 'Data Collection', subtitle: 'Upload & preprocess' },
  chunk: { title: 'Chunking', subtitle: 'Split into passages' },
  index: { title: 'Indexing', subtitle: 'Embed & store vectors' },
  search: { title: 'Semantic Search', subtitle: 'Retrieve nearest chunks' },
  generate: { title: 'Generation', subtitle: 'LLM produces the answer' },
}

const initialStepState = () => ({
  status: 'idle', // idle | running | complete | error
  output: null,
  error: null,
})

export const useRagStore = create((set, get) => ({
  sessionId: null,
  activeStepId: null,
  isSimulating: false,

  configs: {
    upload: { mode: 'text', textInput: '', files: [] },
    chunk: { chunkSize: 500, chunkOverlap: 50, strategy: 'recursive' },
    index: {},
    search: { query: 'What is this document about?', topK: 3 },
    generate: {
      query: 'What is this document about?',
      modelId: 'qwen2',
      topK: 3,
      maxTokens: 512,
      systemPrompt: '',
    },
  },

  steps: {
    upload: initialStepState(),
    chunk: initialStepState(),
    index: initialStepState(),
    search: initialStepState(),
    generate: initialStepState(),
  },

  openStep: (id) => set({ activeStepId: id }),
  closeStep: () => set({ activeStepId: null }),

  updateConfig: (stepId, patch) =>
    set((s) => ({ configs: { ...s.configs, [stepId]: { ...s.configs[stepId], ...patch } } })),

  setStepStatus: (stepId, status, error = null) =>
    set((s) => ({ steps: { ...s.steps, [stepId]: { ...s.steps[stepId], status, error } } })),

  setStepOutput: (stepId, output) =>
    set((s) => ({ steps: { ...s.steps, [stepId]: { ...s.steps[stepId], output, status: 'complete' } } })),

  resetPipeline: () =>
    set({
      sessionId: null,
      steps: {
        upload: initialStepState(),
        chunk: initialStepState(),
        index: initialStepState(),
        search: initialStepState(),
        generate: initialStepState(),
      },
    }),

  resetFrom: (stepId) =>
    set((s) => {
      const idx = STEP_IDS.indexOf(stepId)
      const steps = { ...s.steps }
      STEP_IDS.forEach((id, i) => {
        if (i >= idx) steps[id] = initialStepState()
      })
      return { steps }
    }),

  runStep: async (stepId) => {
    const { configs, sessionId, setStepStatus, setStepOutput } = get()
    setStepStatus(stepId, 'running')
    try {
      if (stepId === 'upload') {
        const cfg = configs.upload
        const res = await ingestDocuments({
          sessionId,
          textInput: cfg.mode === 'text' ? cfg.textInput : '',
          files: cfg.mode === 'pdf' ? cfg.files : [],
        })
        set({ sessionId: res.session_id })
        setStepOutput('upload', res)
      } else if (stepId === 'chunk') {
        const cfg = configs.chunk
        const res = await createChunks({
          session_id: get().sessionId,
          chunk_size: cfg.chunkSize,
          chunk_overlap: cfg.chunkOverlap,
          strategy: cfg.strategy,
        })
        setStepOutput('chunk', res)
      } else if (stepId === 'index') {
        const res = await buildIndex(get().sessionId)
        setStepOutput('index', res)
      } else if (stepId === 'search') {
        const cfg = configs.search
        const res = await semanticSearch({ sessionId: get().sessionId, query: cfg.query, topK: cfg.topK })
        setStepOutput('search', res)
      } else if (stepId === 'generate') {
        const cfg = configs.generate
        const res = await generateAnswer({
          session_id: get().sessionId,
          query: cfg.query,
          model_id: cfg.modelId,
          top_k: cfg.topK,
          max_tokens: cfg.maxTokens,
          system_prompt: cfg.systemPrompt || null,
        })
        setStepOutput('generate', res)
      }
      return true
    } catch (err) {
      const message = err?.response?.data?.detail || err.message || 'Something went wrong'
      setStepStatus(stepId, 'error', message)
      return false
    }
  },

  runSimulation: async () => {
    const { runStep, resetPipeline, configs } = get()
    resetPipeline()
    set({ isSimulating: true, sessionId: null })
    const savedConfigs = configs
    set({ configs: savedConfigs })

    for (const stepId of STEP_IDS) {
      const ok = await get().runStep(stepId)
      if (!ok) {
        set({ isSimulating: false })
        return
      }
    }
    set({ isSimulating: false })
  },

  runFromStep: async (startStepId) => {
    const { resetFrom, runStep } = get()
    resetFrom(startStepId)
    set({ isSimulating: true })
    const startIdx = STEP_IDS.indexOf(startStepId)
    for (const stepId of STEP_IDS.slice(startIdx)) {
      const ok = await runStep(stepId)
      if (!ok) break
    }
    set({ isSimulating: false })
  },
}))
