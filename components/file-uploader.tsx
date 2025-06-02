"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { X, Upload, FileText } from "lucide-react"

interface FileUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  maxSize?: number
  accept?: Record<string, string[]>
}

export function FileUploader({
  value = [],
  onChange,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept,
}: FileUploaderProps) {
  const [files, setFiles] = useState<{ name: string; url: string }[]>(
    value.map((url) => ({
      name: url.split("/").pop() || "file",
      url,
    })),
  )

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > maxFiles) {
        alert(`You can only upload up to ${maxFiles} files`)
        return
      }

      // In a real app, you would upload these files to your server or cloud storage
      // and get back URLs. For this demo, we'll create fake URLs.
      const newFiles = acceptedFiles.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      }))

      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)
      onChange(updatedFiles.map((file) => file.url))
    },
    [files, maxFiles, onChange],
  )

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index)
    setFiles(updatedFiles)
    onChange(updatedFiles.map((file) => file.url))
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: maxFiles - files.length,
    maxSize,
    accept,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer ${
          isDragActive ? "border-primary bg-primary/10" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? "Drop the files here..." : "Drag & drop files here, or click to select files"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Max {maxFiles} files, up to {maxSize / (1024 * 1024)}MB each
        </p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li key={index} className="flex items-center justify-between p-2 border rounded-md">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-500" />
                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeFile(index)}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

