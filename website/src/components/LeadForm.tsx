import { useState } from 'react';
import type { FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { leadAssurances, orderVolumeOptions } from '../data/leadForm';
import { pricingTiers } from '../data/pricing';
import type { PlanId } from '../data/pricing';

type LeadFormProps = { plan: PlanId; onPlanChange: (plan: PlanId) => void };

type Status = 'idle' | 'submitted';
type Errors = { email?: string; volume?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LeadForm({ plan, onPlanChange }: LeadFormProps) {
  const selectedTier = pricingTiers.find((t) => t.id === plan) ?? pricingTiers[0];
  const [email, setEmail] = useState('');
  const [volume, setVolume] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Errors = {};
    if (!email.trim()) next.email = 'Enter your work email.';
    else if (!EMAIL_PATTERN.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!volume) next.volume = 'Select your monthly order volume.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      return;
    }
    const subject = encodeURIComponent(`Marginovia Demo Request – ${selectedTier.name}`);
    const body = encodeURIComponent(
      `Email: ${email.trim()}\nPlan: ${selectedTier.name} (${selectedTier.price})\nMonthly order volume: ${volume}\n\nA potential customer has requested a demo of Marginovia. Please follow up.`,
    );
    window.location.href = `mailto:sales@marginovia.example.com?subject=${subject}&body=${body}`;
    setStatus('submitted');
  };

  const reset = () => {
    setEmail('');
    setVolume('');
    setErrors({});
    setStatus('idle');
  };

  return (
    <section id="get-started" aria-labelledby="cta-heading" className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="grid gap-10 overflow-hidden rounded-[14px] bg-[#0B1F44] p-7 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:p-14">
          <div>
            <h2 id="cta-heading" className="font-display text-3xl font-bold tracking-tight text-[#F1F5F9] sm:text-4xl">
              Ready to see where your COD money stands?
            </h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#F1F5F9]/80">
              Start with a free reconciliation run in the Marginovia workspace, or request a demo and we’ll help you get set up for your volume and couriers.
            </p>
            <ul className="mt-8 space-y-3">
              {leadAssurances.map((a) => (
                <li key={a} className="flex items-center gap-3 text-[15px] text-[#F1F5F9]/90">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <CheckIcon className="h-3 w-3 text-white" aria-hidden="true" />
                  </span>
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-[14px] bg-surface p-6 shadow-lift sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {status === 'submitted' ? (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  role="status"
                  aria-live="polite"
                  className="py-6 text-center"
                >
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft">
                    <CheckIcon className="h-5 w-5 text-accent-ink" aria-hidden="true" />
                  </div>
                  <p className="mt-4 font-display text-xl font-bold text-ink">Thanks for your interest</p>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
                    We’ve noted your interest in <span className="font-semibold text-ink">{selectedTier.name}</span> for{' '}
                    <span className="font-semibold text-ink">{email}</span> ({volume}). You can start a free analysis now in the workspace.
                  </p>
                  <div className="mt-6 flex flex-col gap-2">
                    <Link
                      to="/app"
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-hover"
                    >
                      Open Marginovia workspace
                      <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <button
                      type="button"
                      onClick={reset}
                      className="text-sm font-semibold text-accent-ink underline-offset-4 hover:underline"
                    >
                      Submit another request
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-5"
                >
                  <div>
                    <h3 className="font-display text-xl font-bold text-ink">Request a demo</h3>
                    <p className="mt-1 text-sm text-muted">Tell us your volume and preferred plan — or jump straight into a free analysis.</p>
                  </div>

                  <fieldset>
                    <legend className="text-sm font-bold text-ink">Plan you’re interested in</legend>
                    <div className="mt-2 grid grid-cols-3 gap-1 rounded-lg border border-line bg-canvas p-1">
                      {pricingTiers.map((t) => (
                        <label
                          key={t.id}
                          className={`relative flex cursor-pointer flex-col items-center rounded-md px-2 py-2 text-center transition-colors duration-150 ease-out has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent ${
                            t.id === plan
                              ? 'bg-surface text-ink shadow-sm ring-1 ring-line dark:bg-canvas'
                              : 'text-muted hover:text-ink'
                          }`}
                        >
                          <input
                            type="radio"
                            name="lead-plan"
                            value={t.id}
                            checked={t.id === plan}
                            onChange={() => onPlanChange(t.id)}
                            className="sr-only"
                          />
                          <span className="text-[13px] font-bold">{t.name}</span>
                          <span className="text-[11px] tabular-nums">{t.price}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <div>
                    <Input
                      id="lead-email"
                      label="Work email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="you@yourstore.pk"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      error={errors.email}
                    />
                  </div>

                  <div>
                    <Select
                      id="lead-volume"
                      label="Monthly order volume"
                      required
                      value={volume}
                      onChange={(e) => {
                        setVolume(e.target.value);
                        if (errors.volume) setErrors((prev) => ({ ...prev, volume: undefined }));
                      }}
                      error={errors.volume}
                    >
                      <option value="" disabled>Select a range</option>
                      {orderVolumeOptions.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </Select>
                  </div>

                  <Button type="submit" variant="primary" size="lg" leftIcon={<ArrowRightIcon className="h-4 w-4" aria-hidden="true" />}>
                    Request Demo
                  </Button>
                  <p className="text-center text-[12px] leading-relaxed text-muted">
                    Prefer to try it now? <Link to="/app" className="font-semibold text-accent-ink underline-offset-4 hover:underline">Start a free analysis</Link>.
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
