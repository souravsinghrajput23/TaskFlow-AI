import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Fetch todos table records from Supabase
  const { data: todos, error } = await supabase.from('todos').select()

  return (
    <div className="min-h-screen bg-[#090714] text-white p-12">
      <div className="max-w-md mx-auto glass-panel p-8 border-white/15">
        <h1 className="text-xl font-extrabold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-6">
          Supabase Integration Test
        </h1>

        {error && (
          <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4">
            Error: {error.message}
          </div>
        )}

        <ul className="space-y-3">
          {todos?.map((todo: any) => (
            <li key={todo.id} className="p-3 rounded-lg bg-white/5 border border-white/5 text-xs flex items-center justify-between">
              <span>{todo.name}</span>
              {todo.is_completed && (
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Done</span>
              )}
            </li>
          ))}
        </ul>

        {(!todos || todos.length === 0) && !error && (
          <p className="text-xs text-gray-400 italic text-center py-6">
            Connected to Supabase, but no todos found. Make sure your "todos" table is created and has records.
          </p>
        )}
      </div>
    </div>
  )
}
