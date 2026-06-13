import { Hono } from 'hono'
const app = new Hono()
app.get('/', (c) => c.json({ success: true, data: { status: 'ok' }, error: null }))
export default app
