'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

interface JobStatus {
  id: number;
  url: string;
  question: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result: string | null;
}

export default function Home() {
  const [url, setUrl] = useState('')
  const [question, setQuestion] = useState('')
  const [jobId, setJobId] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: async (newJob: { url: string; question: string; userId: string }) => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
      })
      if (!response.ok) {
        throw new Error('Failed to create job')
      }
      return response.json()
    },
    onSuccess: (data) => {
      setJobId(data.id)
    },
  })

  const { data: status, isError, error } = useQuery<JobStatus>({
    queryKey: ['jobStatus', jobId],
    queryFn: async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }
      return response.json()
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false
      }
      return 1000 // Poll every 1 second
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (url && question) {
      mutation.mutate({ url, question, userId: 'demo-user' })
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-3xl">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold text-white tracking-tight mb-2">
            Research Assistant
          </h1>
          <p className="text-gray-500">
            Extract accurate insights from any web source.
          </p>
        </div>

        <div className="bg-[#0A0A0A] border border-gray-800 rounded-xl shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium text-gray-400 ml-1">
                Target URL
              </label>
              <input
                type="url"
                id="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors placeholder-gray-600"
                placeholder="https://example.com/article"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="question" className="text-sm font-medium text-gray-400 ml-1">
                Specific Question
              </label>
              <input
                type="text"
                id="question"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-[#111] border border-gray-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-600 focus:ring-1 focus:ring-gray-600 transition-colors placeholder-gray-600"
                placeholder="e.g. What are the key takeaways?"
              />
            </div>

            <button
              type="submit"
              disabled={mutation.isPending || (status && status.status !== 'completed' && status.status !== 'failed')}
              className="w-full bg-white hover:bg-gray-100 text-black font-medium py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {mutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-black rounded-full animate-spin"></span>
                  <span>Processing...</span>
                </>
              ) : (
                'Analyze Content'
              )}
            </button>
          </form>

          {mutation.isError && (
            <div className="mt-6 p-4 bg-red-900/10 border border-red-900/20 rounded-lg text-red-400 text-sm">
              {mutation.error.message}
            </div>
          )}

          {isError && (
            <div className="mt-6 p-4 bg-red-900/10 border border-red-900/20 rounded-lg text-red-400 text-sm">
              Status Error: {error.message}
            </div>
          )}

          {status && (
            <div className={`mt-8 transition-all duration-500 ease-in-out ${status ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

              {/* Progress / Status Indicator */}
              <div className="mb-6">
                <div className="flex justify-between items-center text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                  <span>{status.status}</span>
                  <span>{status.progress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-1 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${status.status === 'failed' ? 'bg-red-500' :
                      status.status === 'completed' ? 'bg-green-500' : 'bg-white'
                      }`}
                    style={{ width: `${status.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Result Area */}
              {status.status === 'completed' && status.result && (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-[#111] rounded-lg border border-gray-800 p-6">
                    <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-widest border-b border-gray-800 pb-2">
                      Analysis Result
                    </h3>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap font-light">
                      {status.result}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Area */}
              {status.status === 'failed' && status.result && (
                <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-6">
                  <h3 className="text-red-500 font-medium mb-2">Extraction Failed</h3>
                  <p className="text-red-400 text-sm">{status.result}</p>
                </div>
              )}
            </div>
          )}
        </div>


      </div>
    </div>
  )
}
