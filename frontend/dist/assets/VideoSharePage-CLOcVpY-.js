const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-C3SkEJPH.js","assets/index-ggzJXSi3.css"])))=>i.map(i=>d[i]);
import { U as useParams, w as useNavigate, r as reactExports, s as useApp, v as useYouTube, t as useToast, j as jsxRuntimeExports, x as LoaderCircle, B as Button, y as Clock, z as Badge, W as Wifi, _ as __vitePreload } from "./index-C3SkEJPH.js";
import { C as Calendar, f as formatDistanceToNow, d as Check, j as Copy, T as Trash2, D as DeleteConfirmationModal } from "./DeleteConfirmationModal-DiJRh7LC.js";
import { A as ArrowLeft } from "./arrow-left-BYgRD7iI.js";
import { E as ExternalLink } from "./external-link-B-Bz-w0c.js";
function VideoSharePage() {
  const { recordingId } = useParams();
  const navigate = useNavigate();
  const [recording, setRecording] = reactExports.useState(null);
  const [isLoading, setIsLoading] = reactExports.useState(true);
  const [copied, setCopied] = reactExports.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = reactExports.useState(false);
  const [isDeleting, setIsDeleting] = reactExports.useState(false);
  const { state } = useApp();
  const { isConnected } = useYouTube();
  const { toast } = useToast();
  reactExports.useEffect(() => {
    const loadRecording = () => {
      if (!recordingId) {
        navigate("/");
        return;
      }
      const foundRecording = state.recordings.find((r) => r.id === recordingId);
      if (foundRecording) {
        setRecording(foundRecording);
        setIsLoading(false);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const title = urlParams.get("title");
        const youtubeId = urlParams.get("youtubeId");
        const youtubeLink = urlParams.get("youtubeLink");
        const duration = urlParams.get("duration");
        const createdAt = urlParams.get("createdAt");
        if (title && (youtubeId || youtubeLink)) {
          setRecording({
            id: recordingId,
            title,
            youtubeVideoId: youtubeId,
            youtubeLink,
            duration: duration ? parseInt(duration) : 0,
            createdAt: createdAt ? new Date(createdAt) : /* @__PURE__ */ new Date(),
            uploadStatus: "completed"
          });
          setIsLoading(false);
        } else {
          navigate("/");
        }
      }
    };
    loadRecording();
  }, [recordingId, state.recordings, navigate]);
  const handleCopyLink = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard"
      });
      setTimeout(() => setCopied(false), 2e3);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };
  const handleOpenYouTube = () => {
    if (recording?.youtubeLink) {
      window.open(recording.youtubeLink, "_blank");
    }
  };
  const handleDelete = async () => {
    if (!recording) return;
    setIsDeleting(true);
    try {
      if (recording.youtubeVideoId) {
        const { RealYouTubeService } = await __vitePreload(async () => {
          const { RealYouTubeService: RealYouTubeService2 } = await import("./index-C3SkEJPH.js").then((n) => n.$);
          return { RealYouTubeService: RealYouTubeService2 };
        }, true ? __vite__mapDeps([0,1]) : void 0);
        await RealYouTubeService.deleteVideo(recording.youtubeVideoId);
      }
      toast({
        title: "Recording deleted",
        description: "The recording has been successfully deleted"
      });
      navigate("/");
    } catch (error) {
      console.error("Failed to delete recording:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the recording",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  const hasYouTubeVideo = recording?.youtubeVideoId && recording?.youtubeLink;
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin mx-auto mb-4" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Loading recording..." })
    ] }) });
  }
  if (!recording || !hasYouTubeVideo) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold mb-4", children: "Recording not found" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground mb-4", children: "The recording you're looking for doesn't exist or is not available on YouTube." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => navigate("/"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
        "Back to Home"
      ] })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-0 z-10 bg-background border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-7xl mx-auto px-4 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => navigate("/"),
            className: "text-muted-foreground hover:text-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4 mr-2" }),
              "Back"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: recording.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTime(recording.duration || 0) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              formatDistanceToNow(recording.createdAt),
              " ago"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", className: "flex items-center space-x-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Wifi, { className: "h-3 w-3" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Synced" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center space-x-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: handleCopyLink,
            className: "flex items-center space-x-2",
            children: [
              copied ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: copied ? "Copied!" : "Copy Link" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            onClick: handleOpenYouTube,
            className: "flex items-center space-x-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Open in YouTube" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "destructive",
            size: "sm",
            onClick: () => setShowDeleteConfirm(true),
            className: "flex items-center space-x-2",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Delete" })
            ]
          }
        )
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-7xl mx-auto px-4 py-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative bg-black rounded-lg overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "iframe",
      {
        src: `https://www.youtube.com/embed/${recording.youtubeVideoId}?autoplay=0&rel=0`,
        className: "w-full aspect-video",
        allowFullScreen: true,
        title: recording.title
      }
    ) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DeleteConfirmationModal,
      {
        isOpen: showDeleteConfirm,
        onClose: () => setShowDeleteConfirm(false),
        onConfirm: handleDelete,
        recording,
        isLoading: isDeleting
      }
    )
  ] });
}
export {
  VideoSharePage as default
};
