import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileSpreadsheet, CheckCircle, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CSVUploaderProps {
  onUploadComplete?: (data: unknown) => void;
}

export const CSVUploader = ({ onUploadComplete }: CSVUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith(".csv")) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.name.endsWith(".csv")) {
      setFile(selectedFile);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    
    // Simulate analysis
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    setIsAnalyzing(false);
    setIsComplete(true);
    onUploadComplete?.({});
  };

  const handleReset = () => {
    setFile(null);
    setIsComplete(false);
    setIsAnalyzing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-8"
    >
      <AnimatePresence mode="wait">
        {isComplete ? (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 rounded-full gradient-success flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-success-foreground" />
            </div>
            <h3 className="text-2xl font-display font-bold text-foreground mb-2">
              Analyse terminée !
            </h3>
            <p className="text-muted-foreground mb-6">
              Votre session a été analysée avec succès.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="heroOutline" onClick={handleReset}>
                Nouvelle analyse
              </Button>
              <Button variant="hero">
                Voir les résultats
              </Button>
            </div>
          </motion.div>
        ) : isAnalyzing ? (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-muted" />
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-display font-bold text-foreground mb-2">
              Analyse en cours...
            </h3>
            <p className="text-muted-foreground">
              Notre IA analyse vos données de course
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-success bg-success/5"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl gradient-success flex items-center justify-center mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-success-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-1">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-1">
                    Glissez votre fichier CSV ici
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    ou cliquez pour sélectionner
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded bg-secondary">MyChron5</span>
                    <span className="px-2 py-1 rounded bg-secondary">AiM</span>
                    <span className="px-2 py-1 rounded bg-secondary">RaceBox</span>
                  </div>
                </div>
              )}
            </div>

            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex justify-center"
              >
                <Button variant="hero" size="lg" onClick={handleAnalyze}>
                  Analyser (≈3s)
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
