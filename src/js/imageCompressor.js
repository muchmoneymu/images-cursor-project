class ImageCompressor {
    constructor(options = {}) {
        this.options = {
            quality: options.quality || 0.8,
            maxWidth: options.maxWidth || 1920,
            maxHeight: options.maxHeight || 1920,
            maxSizeMB: options.maxSizeMB || 1
        };
    }

    async compress(file) {
        try {
            // 创建图片预览
            const preview = await this.createPreview(file);
            
            // 压缩图片
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let { width, height } = preview;
            
            // 调整尺寸
            if (width > this.options.maxWidth || height > this.options.maxHeight) {
                const ratio = Math.min(
                    this.options.maxWidth / width,
                    this.options.maxHeight / height
                );
                width *= ratio;
                height *= ratio;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // 绘制图片
            ctx.drawImage(preview, 0, 0, width, height);
            
            // 转换为Blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(
                    resolve,
                    file.type,
                    this.options.quality
                );
            });
            
            return {
                blob,
                preview: preview.src,
                originalSize: file.size,
                compressedSize: blob.size,
                name: file.name,
                type: file.type
            };
        } catch (error) {
            throw new Error(`压缩失败: ${error.message}`);
        }
    }

    createPreview(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }
} 