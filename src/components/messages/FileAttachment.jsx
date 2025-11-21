import React from "react";
import { Button } from "@/components/ui/button";
import { FileText, Image, Download, X } from "lucide-react";

export default function FileAttachment({ file, onRemove, showRemove = false }) {
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = () => {
    if (file.type?.startsWith('image/')) return <Image className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  const isImage = file.type?.startsWith('image/');

  return (
    <div className="relative group">
      {isImage && file.url ? (
        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
          <img 
            src={file.url} 
            alt={file.name} 
            className="w-full h-full object-cover"
          />
          {showRemove && (
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={onRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-blue-600">
            {getFileIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
            <p className="text-xs text-gray-500">{formatFileSize(file.size || 0)}</p>
          </div>
          {file.url && (
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="h-8 w-8">
                <Download className="w-4 h-4" />
              </Button>
            </a>
          )}
          {showRemove && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-red-600 hover:bg-red-50"
              onClick={onRemove}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}