const Tesseract = require('tesseract.js');
const axios = require('axios');

class ImageAnalysisService {
    async analyzeImage(imageUrl) {
        if (!imageUrl || typeof imageUrl !== 'string') return null;
        
        try {
            const url = new URL(imageUrl);
            if (!['http:', 'https:'].includes(url.protocol)) {
                console.warn('Invalid image URL protocol');
                return null;
            }
            
            console.log('📷 Starting image analysis...');
            
            const response = await axios.get(imageUrl, { 
                responseType: 'arraybuffer',
                timeout: 15000,
                maxContentLength: 10 * 1024 * 1024,
                validateStatus: (status) => status === 200
            });
            
            if (!response.data) return null;
            
            console.log('🔍 Extracting text from image...');
            
            const { data: { text } } = await Tesseract.recognize(
                Buffer.from(response.data),
                'eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                        }
                    }
                }
            );
            
            if (text && typeof text === 'string' && text.trim().length > 0) {
                console.log('✅ Image text extracted successfully');
                return text.trim();
            }
            
            console.log('⚠️ No text found in image');
            return null;
        } catch (error) {
            if (error.code === 'ECONNABORTED') {
                console.error('⏱️ Image analysis timeout');
            } else if (error.message?.includes('URL')) {
                console.error('🔗 Invalid image URL');
            } else {
                console.error('❌ Image analysis error:', error.message);
            }
            return null;
        }
    }
}

module.exports = ImageAnalysisService;