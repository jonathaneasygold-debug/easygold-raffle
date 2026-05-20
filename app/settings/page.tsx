'use client'

export default function SettingsPage() {
  return (
    <main className="px-10 py-12 max-w-[1200px] mx-auto">
      <header className="mb-10">
        <h2
          className="text-5xl font-extrabold text-primary uppercase tracking-tight mb-3"
          style={{ fontFamily: 'var(--font-sora)' }}
        >
          Settings
        </h2>
        <p className="text-[17px] text-on-surface-variant">
          Configure your Easy Gold instance.
        </p>
      </header>

      <div className="glass-card rounded-xl p-8 space-y-6">
        <div>
          <h3 className="text-[17px] font-semibold text-on-surface mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
            Google Sheets Integration
          </h3>
          <p className="text-[14px] text-on-surface-variant mb-4">
            Set the{' '}
            <code className="bg-surface-container px-1.5 py-0.5 rounded text-primary text-[13px]">
              NEXT_PUBLIC_APPS_SCRIPT_URL
            </code>{' '}
            environment variable in your Vercel project to enable draw history persistence.
          </p>
          <div className="p-4 bg-surface-container-high rounded-lg border border-outline-variant/40">
            <p className="text-[13px] text-on-surface-variant font-mono">
              NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_ID/exec
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-outline-variant/30">
          <h3 className="text-[17px] font-semibold text-on-surface mb-1" style={{ fontFamily: 'var(--font-sora)' }}>
            Draw History Status
          </h3>
          <p className="text-[14px] text-on-surface-variant">
            {process.env.NEXT_PUBLIC_APPS_SCRIPT_URL ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                Google Sheets connected
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
                Not configured — draw history will not persist
              </span>
            )}
          </p>
        </div>
      </div>
    </main>
  )
}
