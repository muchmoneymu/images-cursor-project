document.addEventListener('DOMContentLoaded', function() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.querySelector('.upload-btn');
    const imageCompressor = new ImageCompressor({
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
        maxSizeMB: 1
    });

    let compressedImages = [];

    const batchActions = document.querySelector('.batch-actions');
    const batchDownloadBtn = document.querySelector('.batch-download-btn');

    // 添加批量下载事件监听
    batchDownloadBtn.addEventListener('click', () => {
        downloadAllImages();
    });

    // 处理拖拽上传
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('dragover');
        const files = e.dataTransfer.files;
        handleFiles(files);
    });

    // 处理点击上传区域
    dropZone.addEventListener('click', (e) => {
        // 防止重复触发
        if (e.target.classList.contains('upload-btn')) {
            return;
        }
        fileInput.click();
    });

    // 处理点击上传按钮
    uploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0) {
            handleFiles(files);
        }
    });

    // 处理文件上传和压缩
    async function handleFiles(files) {
        const imageFiles = Array.from(files).filter(file => 
            file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            showMessage('请选择图片文件！', 'error');
            return;
        }

        // 显示加载状态
        showUploadProgress();

        try {
            for (const file of imageFiles) {
                // 检查文件大小
                if (file.size > 50 * 1024 * 1024) { // 50MB 限制
                    showMessage(`文件 ${file.name} 太大，请选择小于 50MB 的图片`, 'error');
                    continue;
                }

                const result = await imageCompressor.compress(file);
                compressedImages.push(result);
                addImagePreview(result);
                
                // 显示批量下载按钮
                if (compressedImages.length > 1) {
                    batchActions.style.display = 'block';
                    updateImageCount(compressedImages.length);
                }
            }
            
            if (compressedImages.length > 0) {
                showMessage('图片压缩完成！', 'info');
            }
        } catch (error) {
            showMessage(error.message, 'error');
        } finally {
            hideUploadProgress();
            // 重置 input 以允许重复上传相同文件
            fileInput.value = '';
        }
    }

    // 显示压缩后的图片预览
    function addImagePreview(imageData) {
        const previewContainer = document.createElement('div');
        previewContainer.className = 'image-preview-item';
        
        previewContainer.innerHTML = `
            <img src="${imageData.preview}" alt="${imageData.name}">
            <div class="image-info">
                <p class="image-name">${imageData.name}</p>
                <p class="image-size">原始大小: ${formatFileSize(imageData.originalSize)}</p>
                <p class="image-size">压缩后: ${formatFileSize(imageData.compressedSize)}</p>
                <p class="compression-ratio">压缩率: ${calculateCompressionRatio(imageData.originalSize, imageData.compressedSize)}%</p>
            </div>
            <div class="image-actions">
                <button class="download-btn" data-index="${compressedImages.length - 1}">下载</button>
                <button class="delete-btn" data-index="${compressedImages.length - 1}">删除</button>
            </div>
        `;

        // 添加下载事件监听
        const downloadBtn = previewContainer.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => {
            const index = downloadBtn.dataset.index;
            downloadImage(compressedImages[index]);
        });

        // 添加删除事件监听
        const deleteBtn = previewContainer.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', () => {
            const index = deleteBtn.dataset.index;
            deleteImage(index, previewContainer);
        });

        const resultsContainer = document.querySelector('.compression-results') || createResultsContainer();
        resultsContainer.appendChild(previewContainer);
    }

    // 下载压缩后的图片
    function downloadImage(imageData) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(imageData.blob);
        link.download = `compressed_${imageData.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // 删除图片
    function deleteImage(index, container) {
        compressedImages.splice(index, 1);
        container.remove();
        
        if (compressedImages.length <= 1) {
            batchActions.style.display = 'none';
        } else {
            updateImageCount(compressedImages.length);
        }
        
        if (compressedImages.length === 0) {
            const resultsContainer = document.querySelector('.compression-results');
            if (resultsContainer) {
                resultsContainer.remove();
            }
        }
    }

    // 创建结果容器
    function createResultsContainer() {
        const container = document.createElement('div');
        container.className = 'compression-results';
        document.querySelector('.upload-section').appendChild(container);
        return container;
    }

    // 工具函数
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function calculateCompressionRatio(originalSize, compressedSize) {
        return ((1 - compressedSize / originalSize) * 100).toFixed(1);
    }

    // UI 反馈函数
    function showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);
        setTimeout(() => messageDiv.remove(), 3000);
    }

    function showUploadProgress() {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'upload-progress';
        progressDiv.innerHTML = `
            <div class="progress-spinner"></div>
            <p>正在处理图片...</p>
        `;
        document.body.appendChild(progressDiv);
    }

    function hideUploadProgress() {
        const progressDiv = document.querySelector('.upload-progress');
        if (progressDiv) {
            progressDiv.remove();
        }
    }

    // 添加批量下载函数
    async function downloadAllImages() {
        if (compressedImages.length === 0) {
            showMessage('没有可下载的图片', 'error');
            return;
        }

        // 如果只有一张图片，直接下载
        if (compressedImages.length === 1) {
            downloadImage(compressedImages[0]);
            return;
        }

        try {
            showMessage('正在准备下载...', 'info');
            
            // 使用 JSZip 创建压缩包
            const zip = new JSZip();
            
            // 添加所有图片到压缩包
            compressedImages.forEach((imageData, index) => {
                const fileName = `compressed_${imageData.name}`;
                zip.file(fileName, imageData.blob);
            });
            
            // 生成压缩包
            const content = await zip.generateAsync({type: 'blob'});
            
            // 下载压缩包
            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `compressed_images_${new Date().getTime()}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            
            showMessage('批量下载完成！', 'info');
        } catch (error) {
            showMessage('批量下载失败，请重试', 'error');
            console.error('批量下载错误：', error);
        }
    }

    // 添加更新图片计数的函数
    function updateImageCount(count) {
        const imageCount = document.querySelector('.image-count');
        if (imageCount) {
            imageCount.textContent = `已选择 ${count} 张图片`;
        }
    }
}); 