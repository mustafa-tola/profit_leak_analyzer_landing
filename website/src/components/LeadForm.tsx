import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightIcon, CheckIcon, ChevronDownIcon, InfoIcon } from 'lucide-react';
import { leadAssurances, orderVolumeOptions } from '../data/leadForm';
import { pricingTiers } from '../data/pricing';
import type { PlanId } from '../data/pricing';

type LeadFormProps = {plan: PlanId;onPlanChange: (plan: PlanId) => void;};

type Status = 'idle' | 'demo';
type Errors = {email?: string;volume?: string;};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadForm({ plan, onPlanChange }: LeadFormProps) {
  const selectedTier = pricingTiers.find((t) => t.id === plan) ?? pricingTiers[0];
  const [email, setEmail] = useState('');
  const [volume, setVolume] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');
  const emailRef = useRef<HTMLInputElement>(null);
  const volumeRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Errors = {};
    if (!email.trim()) next.email = 'Enter your work email.';else
    if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!volume) next.volume = 'Select your monthly order volume.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      requestAnimationFrame(() => {
        if (next.email) emailRef.current?.focus();else
        volumeRef.current?.focus();
      });
      return;
    }
    setStatus('demo');
  };

  const reset = () => {
    setEmail('');
    setVolume('');
    setErrors({});
    setStatus('idle');
  };

  const inputBase =
  'h-11 w-full rounded-lg border bg-surface px-3.5 text-[15px] text-ink placeholder:text-muted/70 transition-[border-color,box-shadow] duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-accent/30';

  return (
    <section id="get-started" aria-labelledby="cta-heading" className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-10 overflow-hidden rounded-3xl bg-navy p-7 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:p-14 dark:border dark:border-line dark:bg-surface">
          <div>
            <h2 id="cta-heading" className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Find out what last month’s COD orders really cost you.
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/70">
              Share an email and order volume to preview the request flow. This academic demo validates the form
              in your browser only — nothing is sent, stored or emailed.
            </p>
            <ul className="mt-8 space-y-3">
              {leadAssurances.map((a) =>
              <li key={a} className="flex items-center gap-3 text-[15px] text-white/90">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <CheckIcon className="h-3 w-3 text-white" aria-hidden="true" />
                  </span>
                  {a}
                </li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl bg-surface p-6 shadow-lift sm:p-8 dark:bg-canvas">
            <AnimatePresence mode="wait" initial={false}>
              {status === 'demo' ?
              <motion.div
                key="demo"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                role="status"
                aria-live="polite"
                className="py-6 text-center">
                
                  <InfoIcon className="mx-auto h-11 w-11 text-warn" aria-hidden="true" />
                  <p className="mt-4 text-xl font-semibold text-ink">Demo complete — nothing was sent</p>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
                    <span className="font-medium text-ink">{email}</span> passed browser validation for the{' '}
                    <span className="font-medium text-ink">{selectedTier.name}</span> plan. This academic prototype
                    does not transmit or store requests, so no analysis has been requested.
                  </p>
                  <p className="mx-auto mt-3 max-w-xs text-[12px] leading-relaxed text-warn">
                    No email will be sent. Reload the page to clear these entries.
                  </p>
                  <button
                  type="button"
                  onClick={reset}
                  className="mt-6 text-sm font-medium text-accent-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  
                    Return to form
                  </button>
                </motion.div> :

              <motion.form
                key="form"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                onSubmit={handleSubmit}
                noValidate
                aria-describedby="lead-demo-note"
                className="space-y-5">
                
                  <p
                  id="lead-demo-note"
                  className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn-soft px-3 py-2.5 text-[12px] leading-relaxed text-warn">
                  
                    <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="font-semibold">Academic demo.</span> Submitting runs validation only. No
                      request is sent, saved or emailed.
                    </span>
                  </p>

                  <fieldset>
                    <legend className="text-sm font-medium text-ink">Plan you’re interested in</legend>
                    <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-line bg-canvas p-1 dark:bg-surface">
                      {pricingTiers.map((t) => {
                      const checked = t.id === plan;
                      return (
                        <label
                          key={t.id}
                          className={`relative flex cursor-pointer flex-col items-center rounded-md px-2 py-2 text-center transition-colors duration-150 ease-out has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                          checked ? 'bg-surface text-ink shadow-sm ring-1 ring-line dark:bg-canvas' : 'text-muted hover:text-ink'}`
                          }>
                          
                            <input
                            type="radio"
                            name="lead-plan"
                            value={t.id}
                            checked={checked}
                            onChange={() => onPlanChange(t.id)}
                            className="sr-only" />
                          
                            <span className="text-[13px] font-semibold">{t.name}</span>
                            <span className="text-[11px] tabular-nums">{t.price}</span>
                          </label>);

                    })}
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor="lead-email" className="block text-sm font-medium text-ink">
                      Work email
                    </label>
                    <input
                    id="lead-email"
                    ref={emailRef}
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="you@yourstore.pk"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'lead-email-error' : undefined}
                    className={`${inputBase} mt-2 ${errors.email ? 'border-orange-600' : 'border-line focus:border-accent'}`} />
                  
                    {errors.email &&
                  <p id="lead-email-error" className="mt-1.5 text-[13px] text-orange-700 dark:text-orange-300">
                        {errors.email}
                      </p>
                  }
                  </div>

                  <div>
                    <label htmlFor="lead-volume" className="block text-sm font-medium text-ink">
                      Monthly order volume
                    </label>
                    <div className="relative mt-2">
                      <select
                      id="lead-volume"
                      ref={volumeRef}
                      required
                      value={volume}
                      onChange={(e) => {
                        setVolume(e.target.value);
                        if (errors.volume) setErrors((prev) => ({ ...prev, volume: undefined }));
                      }}
                      aria-invalid={Boolean(errors.volume)}
                      aria-describedby={errors.volume ? 'lead-volume-error' : undefined}
                      className={`${inputBase} appearance-none pr-10 ${volume ? '' : 'text-muted'} ${
                      errors.volume ? 'border-orange-600' : 'border-line focus:border-accent'}`
                      }>
                      
                        <option value="" disabled>
                          Select a range
                        </option>
                        {orderVolumeOptions.map((o) =>
                      <option key={o} value={o}>
                            {o}
                          </option>
                      )}
                      </select>
                      <ChevronDownIcon
                      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                      aria-hidden="true" />
                    
                    </div>
                    {errors.volume &&
                  <p id="lead-volume-error" className="mt-1.5 text-[13px] text-orange-700 dark:text-orange-300">
                        {errors.volume}
                      </p>
                  }
                  </div>

                  <button
                  type="submit"
                  aria-describedby="lead-demo-note"
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[15px] font-semibold text-white shadow-sm transition-[background-color,transform] duration-150 ease-out hover:bg-accent-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                  
                    Preview Demo Request
                    <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <p className="text-center text-[12px] leading-relaxed text-muted">
                    Demo only — your entries stay in this browser tab and are not submitted anywhere.
                  </p>
                </motion.form>
              }
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>);

}