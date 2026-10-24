import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Check,
  Video,
  FileText,
  Upload,
  X,
  Star,
  Loader2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TestimonialWizardProvider,
  useTestimonialWizard,
  MediaType,
  PersonalInfo,
} from "@/contexts/TestimonialWizardContext";

const MAX_VIDEO_MB = 20;
const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;
const MAX_AVATAR_MB = 1;
const MAX_AVATAR_BYTES = MAX_AVATAR_MB * 1024 * 1024;
const MAX_AVATAR_DIMENSION = 2048;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ── AvatarUploader ────────────────────────────────────────────────────────────

function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas is empty"));
    }, "image/jpeg", 0.92);
  });
}

function AvatarUploader() {
  const { state, dispatch } = useTestimonialWizard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [rawSrc, setRawSrc] = useState<string>("");
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { naturalWidth, naturalHeight, width, height } = e.currentTarget;
    const isSquare = Math.abs(naturalWidth - naturalHeight) <= 5;
    if (isSquare) {
      confirmCrop(e.currentTarget, {
        unit: "px",
        x: 0,
        y: 0,
        width,
        height,
      });
      return;
    }
    const initial = centerCrop(
      makeAspectCrop({ unit: "%", width: 90 }, 1, width, height),
      width,
      height,
    );
    setCrop(initial);
  }

  async function confirmCrop(img?: HTMLImageElement, fallbackCrop?: PixelCrop) {
    const image = img ?? imgRef.current;
    const pixelCrop = fallbackCrop ?? completedCrop;
    if (!image || !pixelCrop) return;

    try {
      const blob = await getCroppedBlob(image, pixelCrop);
      if (blob.size > MAX_AVATAR_BYTES) {
        toast.error(`A foto deve ter no máximo ${MAX_AVATAR_MB} MB após o corte.`);
        cancelCrop();
        return;
      }
      const previewUrl = URL.createObjectURL(blob);
      dispatch({ type: "SET_AVATAR", payload: { file: blob, previewUrl } });
      setShowCrop(false);
      setRawSrc("");
    } catch {
      toast.error("Erro ao processar a imagem.");
    }
  }

  function cancelCrop() {
    setShowCrop(false);
    setRawSrc("");
    setCrop(undefined);
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES * 5) {
      toast.error(`A foto é muito grande. Selecione uma imagem menor.`);
      return;
    }

    const bitmap = await createImageBitmap(file);
    if (bitmap.width > MAX_AVATAR_DIMENSION || bitmap.height > MAX_AVATAR_DIMENSION) {
      toast.error(`A resolução máxima permitida é ${MAX_AVATAR_DIMENSION}×${MAX_AVATAR_DIMENSION} px.`);
      return;
    }

    const src = URL.createObjectURL(file);
    setRawSrc(src);
    setShowCrop(true);
  }

  return (
    <div>
      <Label className="text-foreground/90 text-sm mb-1.5 block">
        Foto de perfil <span className="text-foreground/42 text-xs">(opcional)</span>
      </Label>

      {state.avatarPreviewUrl ? (
        <div className="flex items-center gap-3">
          <img
            src={state.avatarPreviewUrl}
            alt="Avatar"
            className="w-14 h-14 rounded-full object-cover border border-foreground/20"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-foreground/65 hover:text-foreground-strong underline underline-offset-2"
            >
              Trocar foto
            </button>
            <span className="text-foreground/25">·</span>
            <button
              type="button"
              onClick={() => dispatch({ type: "CLEAR_AVATAR" })}
              className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 underline underline-offset-2"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-foreground/10 bg-foreground/3 hover:bg-foreground/5 hover:border-foreground/20 transition-colors text-sm text-foreground/65 hover:text-foreground-strong"
        >
          <Camera className="w-4 h-4" />
          Escolher foto
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />

      {showCrop && rawSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4">
          <div className="bg-muted rounded-2xl border border-foreground/10 p-5 space-y-4 w-full max-w-sm">
            <p className="text-foreground-strong font-semibold text-sm">Ajustar foto</p>
            <div className="overflow-hidden rounded-lg">
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={rawSrc}
                  alt="Crop"
                  className="max-h-72 w-full object-contain"
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={cancelCrop} className="text-foreground/65">
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => confirmCrop()}
                disabled={!completedCrop}
                className="bg-neon-lime text-on-accent hover:bg-neon-lime/90 font-semibold"
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Step 0: MediaChoice ───────────────────────────────────────────────────────

function MediaChoiceStep() {
  const { state, dispatch } = useTestimonialWizard();

  function choose(type: MediaType) {
    dispatch({ type: "SET_MEDIA_TYPE", payload: type });
    dispatch({ type: "NEXT_STEP" });
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-foreground-strong mb-2">
          Como você prefere deixar seu depoimento?
        </h2>
        <p className="text-foreground/65 text-sm">
          Sua opinião é muito importante para mim
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => choose("video")}
          className={cn(
            "relative flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all",
            "border-neon-purple/50 bg-neon-purple/5 hover:bg-neon-purple/10 hover:border-neon-purple group",
          )}
        >
          <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center group-hover:bg-neon-purple/30 transition-colors">
            <Video className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-foreground-strong">Vídeo</span>
              <span className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded-full font-medium">
                Recomendado ⭐
              </span>
            </div>
            <p className="text-sm text-foreground/65 leading-relaxed">
              Vídeos têm muito mais impacto e ajudam a transmitir autenticidade.
              Leva menos de 2 minutos e faz uma diferença enorme para quem está
              considerando me contratar!
            </p>
            <p className="text-xs text-foreground/42 mt-2">MP4, MOV ou WebM · máx. {MAX_VIDEO_MB} MB</p>
          </div>
        </button>

        <button
          onClick={() => choose("text")}
          className={cn(
            "flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all",
            "border-foreground/10 bg-foreground/3 hover:bg-foreground/5 hover:border-foreground/20 group",
          )}
        >
          <div className="mt-0.5 flex-shrink-0 w-10 h-10 rounded-full bg-foreground/10 flex items-center justify-center group-hover:bg-foreground/15 transition-colors">
            <FileText className="w-5 h-5 text-foreground/90" />
          </div>
          <div>
            <span className="font-semibold text-foreground-strong">Texto escrito</span>
            <p className="text-sm text-foreground/65 leading-relaxed mt-1">
              Prefiro escrever minha experiência em palavras.
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}

// ── Step 1 (text): TextInputStep ──────────────────────────────────────────────

function TextInputStep() {
  const { state, dispatch } = useTestimonialWizard();
  const MIN_CHARS = 50;
  const MAX_CHARS = 500;
  const len = state.text.length;
  const isValid = len >= MIN_CHARS && len <= MAX_CHARS;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground-strong mb-1">
          Conte sua experiência
        </h2>
        <p className="text-foreground/65 text-sm">Seja autêntico — isso faz toda a diferença</p>
      </div>

      <div>
        <Textarea
          value={state.text}
          onChange={(e) => dispatch({ type: "SET_TEXT", payload: e.target.value })}
          placeholder="Descreva como foi trabalhar comigo, o que gostou, os resultados que obteve..."
          className="min-h-[160px] bg-muted border-foreground/10 text-foreground-strong placeholder:text-foreground/25 resize-none"
          maxLength={MAX_CHARS}
        />
        <div className={cn("text-xs mt-1 text-right", len < MIN_CHARS ? "text-foreground/42" : "text-neon-lime")}>
          {len}/{MAX_CHARS} {len < MIN_CHARS && `(mín. ${MIN_CHARS})`}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          className="text-foreground/65 hover:text-foreground-strong"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button
          onClick={() => dispatch({ type: "NEXT_STEP" })}
          disabled={!isValid}
          className="bg-neon-lime text-on-accent hover:bg-neon-lime/90 font-semibold"
        >
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 1 (video): VideoUploadStep ──────────────────────────────────────────

function VideoUploadStep() {
  const { state, dispatch } = useTestimonialWizard();
  const generateUrl = useMutation(api.testimonialSubmissions.generateVideoUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Por favor selecione um arquivo de vídeo (MP4, MOV, WebM).");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error(`O vídeo deve ter no máximo ${MAX_VIDEO_MB} MB.`);
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const uploadUrl = await generateUrl({ fileSizeBytes: file.size });
      setProgress(30);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(30 + Math.floor((e.loaded / e.total) * 60));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload falhou: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Erro de rede no upload"));
        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      setProgress(95);
      const { storageId } = JSON.parse(xhr.responseText);
      dispatch({
        type: "SET_VIDEO",
        payload: { storageId, fileSize: file.size, fileName: file.name },
      });
      setProgress(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("VIDEO_TOO_LARGE")) {
        toast.error(`O vídeo deve ter no máximo ${MAX_VIDEO_MB} MB.`);
      } else if (msg.includes("VIDEO_DAILY_LIMIT_REACHED")) {
        toast.error("Limite diário de uploads de vídeo atingido. Tente novamente amanhã ou envie um depoimento em texto.");
      } else {
        toast.error("Erro ao fazer upload do vídeo. Tente novamente.");
      }
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground-strong mb-1">Envie seu vídeo</h2>
        <p className="text-foreground/65 text-sm">MP4, MOV ou WebM · máx. {MAX_VIDEO_MB} MB</p>
      </div>

      {!state.videoStorageId ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-foreground/20 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:border-neon-purple/50 hover:bg-neon-purple/5 transition-all"
        >
          {uploading ? (
            <>
              <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
              <p className="text-sm text-foreground/65">{progress}% enviado...</p>
              <div className="w-full bg-foreground/10 rounded-full h-1.5 mt-1">
                <div
                  className="bg-neon-purple h-1.5 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-foreground/42" />
              <p className="text-sm text-foreground-strong font-medium">Clique para selecionar o vídeo</p>
              <p className="text-xs text-foreground/42">ou arraste e solte aqui</p>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-neon-lime/10 border border-neon-lime/30 rounded-xl">
          <Check className="w-5 h-5 text-neon-lime flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground-strong font-medium truncate">{state.videoFileName}</p>
            <p className="text-xs text-foreground/65">
              {state.videoFileSize ? `${(state.videoFileSize / (1024 * 1024)).toFixed(1)} MB` : ""}
            </p>
          </div>
          <button
            onClick={() =>
              dispatch({ type: "SET_VIDEO", payload: { storageId: "", fileSize: 0, fileName: "" } })
            }
            className="text-foreground/42 hover:text-foreground-strong"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          className="text-foreground/65 hover:text-foreground-strong"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button
          onClick={() => dispatch({ type: "NEXT_STEP" })}
          disabled={!state.videoStorageId || uploading}
          className="bg-neon-lime text-on-accent hover:bg-neon-lime/90 font-semibold"
        >
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 2: PersonalInfoStep ──────────────────────────────────────────────────

function PersonalInfoStep() {
  const { state, dispatch } = useTestimonialWizard();
  const info = state.personalInfo;

  function update(field: keyof PersonalInfo, value: string) {
    dispatch({ type: "SET_PERSONAL_INFO", payload: { ...info, [field]: value } });
  }

  const isValid = info.name.trim().length >= 2 && info.role.trim().length >= 2 && info.email.includes("@");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground-strong mb-1">Seus dados</h2>
        <p className="text-foreground/65 text-sm">
          O e-mail não será exibido publicamente
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-foreground/90 text-sm mb-1.5 block">
            Nome completo <span className="text-neon-purple">*</span>
          </Label>
          <Input
            value={info.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Seu nome"
            className="bg-muted border-foreground/10 text-foreground-strong placeholder:text-foreground/25"
          />
        </div>

        <div>
          <Label className="text-foreground/90 text-sm mb-1.5 block">
            Cargo / Função <span className="text-neon-purple">*</span>
          </Label>
          <Input
            value={info.role}
            onChange={(e) => update("role", e.target.value)}
            placeholder="Ex: CEO, Desenvolvedor, Designer..."
            className="bg-muted border-foreground/10 text-foreground-strong placeholder:text-foreground/25"
          />
        </div>

        <div>
          <Label className="text-foreground/90 text-sm mb-1.5 block">Empresa (opcional)</Label>
          <Input
            value={info.company}
            onChange={(e) => update("company", e.target.value)}
            placeholder="Nome da empresa"
            className="bg-muted border-foreground/10 text-foreground-strong placeholder:text-foreground/25"
          />
        </div>

        <div>
          <Label className="text-foreground/90 text-sm mb-1.5 block">
            E-mail <span className="text-neon-purple">*</span>
          </Label>
          <Input
            type="email"
            value={info.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="seu@email.com"
            className="bg-muted border-foreground/10 text-foreground-strong placeholder:text-foreground/25"
          />
        </div>

        <AvatarUploader />
      </div>

      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          className="text-foreground/65 hover:text-foreground-strong"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button
          onClick={() => dispatch({ type: "NEXT_STEP" })}
          disabled={!isValid}
          className="bg-neon-lime text-on-accent hover:bg-neon-lime/90 font-semibold"
        >
          Revisar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

// ── Step 3: SummaryStep ───────────────────────────────────────────────────────

function SummaryStep({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useTestimonialWizard();
  const generateAvatarUrl = useMutation(api.testimonialSubmissions.generateAvatarUploadUrl);
  const info = state.personalInfo;

  async function handleSubmit() {
    dispatch({ type: "SUBMIT_START" });
    try {
      let avatarStorageId: string | undefined;
      let avatarFileSize: number | undefined;

      if (state.avatarFile) {
        const uploadUrl = await generateAvatarUrl({ fileSizeBytes: state.avatarFile.size });
        const res = await fetch(uploadUrl, { method: "POST", body: state.avatarFile });
        const { storageId } = await res.json();
        avatarStorageId = storageId;
        avatarFileSize = state.avatarFile.size;
      }

      const siteUrl = (import.meta.env.VITE_CONVEX_URL as string)?.replace('.convex.cloud', '.convex.site');
      const res = await fetch(`${siteUrl}/api/testimonial/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: info.name.trim(),
          role: info.role.trim(),
          company: info.company.trim() || undefined,
          email: info.email.trim(),
          type: state.mediaType,
          text: state.mediaType === "text" ? state.text : undefined,
          videoStorageId: state.mediaType === "video" && state.videoStorageId ? state.videoStorageId : undefined,
          videoFileSize: state.videoFileSize ?? undefined,
          avatarStorageId: avatarStorageId ?? undefined,
          avatarFileSize,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'ERROR');
      }
      dispatch({ type: "SUBMIT_SUCCESS" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("RATE_LIMITED")) {
        dispatch({ type: "SUBMIT_ERROR", payload: "Você já enviou um depoimento recentemente. Tente novamente em 7 dias." });
      } else if (msg.includes("AVATAR_TOO_LARGE")) {
        dispatch({ type: "SUBMIT_ERROR", payload: `A foto deve ter no máximo ${MAX_AVATAR_MB} MB.` });
      } else {
        dispatch({ type: "SUBMIT_ERROR", payload: "Erro ao enviar. Tente novamente." });
      }
    }
  }

  if (state.isSuccess) {
    return (
      <div className="flex flex-col items-center text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-neon-lime/20 flex items-center justify-center">
          <Check className="w-8 h-8 text-neon-lime" />
        </div>
        <h2 className="text-xl font-bold text-foreground-strong">Obrigado pelo depoimento!</h2>
        <p className="text-foreground/65 text-sm max-w-xs">
          Recebi seu depoimento e vou revisá-lo em breve. Após aprovação, ele poderá aparecer no meu portfólio.
        </p>
        <Button onClick={onClose} className="mt-4 bg-neon-lime text-on-accent hover:bg-neon-lime/90 font-semibold">
          Fechar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground-strong mb-1">Revisar e enviar</h2>
        <p className="text-foreground/65 text-sm">Confira os dados antes de enviar</p>
      </div>

      <div className="space-y-3 bg-muted rounded-xl p-4 border border-foreground/5">
        <div className="flex items-center gap-3">
          {state.avatarPreviewUrl ? (
            <img src={state.avatarPreviewUrl} alt={info.name} className="w-10 h-10 rounded-full object-cover border border-foreground/10" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold text-sm flex-shrink-0">
              {info.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-foreground-strong">{info.name}</p>
            <p className="text-xs text-neon-purple">
              {info.role}{info.company ? ` · ${info.company}` : ""}
            </p>
          </div>
        </div>

        <div className="border-t border-foreground/5 pt-3">
          {state.mediaType === "text" ? (
            <p className="text-sm text-foreground/90 italic leading-relaxed">"{state.text}"</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-foreground/90">
              <Video className="w-4 h-4 text-neon-purple" />
              <span>Vídeo: {state.videoFileName}</span>
            </div>
          )}
        </div>
      </div>

      {state.error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          {state.error}
        </p>
      )}

      <div className="flex justify-between pt-2">
        <Button
          variant="ghost"
          onClick={() => dispatch({ type: "PREV_STEP" })}
          disabled={state.isSubmitting}
          className="text-foreground/65 hover:text-foreground-strong"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={state.isSubmitting}
          className="bg-neon-purple text-primary-foreground hover:bg-neon-purple/90 font-semibold"
        >
          {state.isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
          ) : (
            <><Send className="w-4 h-4 mr-2" /> Enviar depoimento</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ── WizardContent ─────────────────────────────────────────────────────────────

function WizardContent({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useTestimonialWizard();
  const dir = 1;

  // step 0 = escolha de tipo
  // step 1 = texto ou vídeo
  // step 2 = dados pessoais
  // step 3 = revisão/envio

  const totalSteps = 4;
  const progressPercent = state.isSuccess ? 100 : (state.step / (totalSteps - 1)) * 100;

  function renderStep() {
    switch (state.step) {
      case 0:
        return <MediaChoiceStep key="media" />;
      case 1:
        return state.mediaType === "video"
          ? <VideoUploadStep key="video" />
          : <TextInputStep key="text" />;
      case 2:
        return <PersonalInfoStep key="personal" />;
      case 3:
        return <SummaryStep key="summary" onClose={onClose} />;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-5">
      {!state.isSuccess && (
        <div className="w-full bg-foreground/5 rounded-full h-1">
          <motion.div
            className="bg-neon-purple h-1 rounded-full"
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      <AnimatePresence mode="wait" custom={dir}>
        <motion.div
          key={state.step}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Public Component ──────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export function TestimonialWizard({ open, onClose }: Props) {
  function handleClose() {
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-card border-foreground/10 max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground-strong">
            <Star className="w-5 h-5 text-neon-purple" />
            Deixar um depoimento
          </DialogTitle>
        </DialogHeader>
        <TestimonialWizardProvider>
          <WizardContent onClose={handleClose} />
        </TestimonialWizardProvider>
      </DialogContent>
    </Dialog>
  );
}
