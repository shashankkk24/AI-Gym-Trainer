"use client"

import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const BODY_PART_OPTIONS = [
  "head",
  "neck",
  "left_shoulder",
  "right_shoulder",
  "upper_back",
  "lower_back",
  "left_elbow",
  "right_elbow",
  "left_wrist",
  "right_wrist",
  "left_hip",
  "right_hip",
  "left_knee",
  "right_knee",
  "left_ankle",
  "right_ankle",
] as const

const SEVERITY_OPTIONS = ["mild", "moderate", "severe"] as const

type InjuryFormProps = {
  userId: string
  bodyPart?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: (injuryId: string) => void
  triggerLabel?: string
}

type ToastState = {
  type: "success" | "error"
  message: string
} | null

type InjuryResponse = {
  success: boolean
  injury_id: string
  detail?: string
}

function createInitialState(bodyPart?: string) {
  return {
    body_part: bodyPart ?? "",
    severity: "" as "" | (typeof SEVERITY_OPTIONS)[number],
    description: "",
  }
}

export function InjuryForm({
  userId,
  bodyPart,
  open,
  onOpenChange,
  onSuccess,
  triggerLabel = "Declare injury",
}: InjuryFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [form, setForm] = useState(() => createInitialState(bodyPart))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isControlled = typeof open === "boolean"
  const dialogOpen = isControlled ? open : internalOpen

  useEffect(() => {
    setForm((current) => ({ ...current, body_part: bodyPart ?? current.body_part }))
  }, [bodyPart])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const setDialogOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen)
    }

    onOpenChange?.(nextOpen)
  }

  const showToast = (nextToast: Exclude<ToastState, null>) => {
    setToast(nextToast)

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current)
    }

    toastTimerRef.current = setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (!form.body_part || !form.severity) {
      setError("Body part and severity are required.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/recovery/injuries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          body_part: form.body_part,
          severity: form.severity,
          description: form.description,
        }),
      })

      const data = (await response.json()) as InjuryResponse

      if (!response.ok || !data.success) {
        throw new Error(data.detail ?? "Failed to create injury.")
      }

      setForm(createInitialState(bodyPart))
      showToast({ type: "success", message: "Injury saved and rehab plan created." })
      setDialogOpen(false)
      onSuccess?.(data.injury_id)
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Something went wrong."
      setError(message)
      showToast({ type: "error", message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {!isControlled ? (
          <DialogTrigger asChild>
            <Button size="lg">{triggerLabel}</Button>
          </DialogTrigger>
        ) : null}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Declare an injury</DialogTitle>
            <DialogDescription>
              Capture the affected body part and severity so the recovery system can generate a week-one rehab plan.
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardHeader>
              <CardTitle>Injury details</CardTitle>
              <CardDescription>
                A new injury is stored immediately and linked rehab exercises are generated automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="injury-body-part">Body part</Label>
                  <Select
                    disabled={loading}
                    value={form.body_part}
                    onValueChange={(value) => setForm((current) => ({ ...current, body_part: value }))}
                  >
                    <SelectTrigger id="injury-body-part">
                      <SelectValue placeholder="Select body part" />
                    </SelectTrigger>
                    <SelectContent>
                      {BODY_PART_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="injury-severity">Severity</Label>
                  <Select
                    disabled={loading}
                    value={form.severity}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        severity: value as (typeof SEVERITY_OPTIONS)[number],
                      }))
                    }
                  >
                    <SelectTrigger id="injury-severity">
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="injury-description">Description</Label>
                  <Textarea
                    id="injury-description"
                    disabled={loading}
                    placeholder="Describe what happened, when it started, and any movement that makes it worse."
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, description: event.target.value }))
                    }
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <Button className="w-full" type="submit" disabled={loading}>
                  {loading ? "Saving injury..." : "Create injury"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {toast ? (
        <div
          aria-live="polite"
          className={`fixed bottom-4 right-4 z-[60] rounded-xl border px-4 py-3 text-sm shadow-lg transition-all ${
            toast.type === "success"
              ? "border-lime-400/30 bg-[#0a0a0f] text-lime-400"
              : "border-red-400/30 bg-[#0a0a0f] text-red-400"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </>
  )
}

export default InjuryForm