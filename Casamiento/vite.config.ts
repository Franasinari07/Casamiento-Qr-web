import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv, type Plugin } from 'vite'

const require = createRequire(import.meta.url)
type LocalApiResponse = {
  status: (code: number) => LocalApiResponse
  json: (payload: unknown) => void
  setHeader: (name: string, value: string) => void
}

type LocalApiRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body: Buffer
}

type LocalApiHandler = (request: LocalApiRequest, response: LocalApiResponse) => Promise<void>

const apiHandlers: Record<string, LocalApiHandler> = {
  '/api/photos': require('../api/photos.js') as LocalApiHandler,
  '/api/upload-photo': require('../api/upload-photo.js') as LocalApiHandler,
}

function localUploadApi(): Plugin {
  return {
    name: 'local-upload-api',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
        const handler = apiHandlers[pathname]
        if (!handler) return next()

        const chunks: Buffer[] = []
        let receivedBytes = 0
        let oversized = false
        request.on('data', (chunk: Buffer | string) => {
          if (oversized) return
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          receivedBytes += buffer.length
          if (receivedBytes > 3 * 1024 * 1024) {
            oversized = true
            response.statusCode = 413
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify({ message: 'La foto supera el límite de 3 MB.' }))
            return
          }
          chunks.push(buffer)
        })
        request.on('end', () => {
          if (oversized || response.writableEnded) return
          void handler(
            {
              method: request.method,
              headers: request.headers,
              body: Buffer.concat(chunks),
            },
            {
              status(code) {
                response.statusCode = code
                return this
              },
              json(payload) {
                response.setHeader('Content-Type', 'application/json')
                response.end(JSON.stringify(payload))
              },
              setHeader(name, value) {
                response.setHeader(name, value)
              },
            },
          ).catch((error: unknown) => {
            const uploadError = error instanceof Error ? error : new Error(String(error))
            server.config.logger.error('Local photo upload failed', { error: uploadError })
            if (!response.writableEnded) {
              response.statusCode = 500
              response.setHeader('Content-Type', 'application/json')
              response.end(JSON.stringify({ message: 'No se pudo procesar la foto.' }))
            }
          })
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  Object.assign(process.env, loadEnv(mode, repositoryRoot, ''))

  return {
    server: { host: '0.0.0.0' },
  plugins: [
    localUploadApi(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  }
})
