import { motion } from 'framer-motion'
import { FiTool, FiPackage, FiCheck } from 'react-icons/fi'
import AuthButton from '../auth/AuthButton'
import ErrorMessage from '../auth/ErrorMessage'

function Step3AdditionalDetails({
  formData,
  errors,
  onInputChange,
  addProduct,
  updateProduct,
  removeProduct,
  toggleTool,
  onBack,
  loading,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="form-step"
    >
      <h2>Ek Bilgiler</h2>

      <div className="form-group">
        <label htmlFor="referral_source">Bizi nereden duydunuz?</label>
        <select
          id="referral_source"
          name="referral_source"
          value={formData.referral_source}
          onChange={onInputChange}
        >
          <option value="">Bir seçenek seçin</option>
          <option value="google">Google Arama</option>
          <option value="social">Sosyal Medya</option>
          <option value="friend">Arkadaş/Aile</option>
          <option value="ad">Reklam</option>
          <option value="other">Diğer</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <FiTool className="input-icon" />
          Mevcut Araçlar
        </label>
        <div className="tools-grid">
          {[
            { key: 'screwdriver', label: 'Tornavida' },
            { key: 'multimeter', label: 'Multimetre' },
            { key: 'wrench', label: 'İngiliz Anahtarı' },
            { key: 'pliers', label: 'Pense' },
            { key: 'drill', label: 'Matkap' },
            { key: 'soldering iron', label: 'Lehim Makinesi' }
          ].map((tool) => (
            <button
              key={tool.key}
              type="button"
              className={`tool-chip ${formData.available_tools.includes(tool.key) ? 'active' : ''}`}
              onClick={() => toggleTool(tool.key)}
            >
              {formData.available_tools.includes(tool.key) && <FiCheck />}
              {tool.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>
          <FiPackage className="input-icon" />
          Sahip Olunan Ürünler
        </label>
        {formData.owned_products.map((product, index) => (
          <div key={index} className="product-row">
            <input
              type="text"
              placeholder="Marka"
              value={product.brand}
              onChange={(e) => updateProduct(index, 'brand', e.target.value)}
            />
            <input
              type="text"
              placeholder="Model"
              value={product.model}
              onChange={(e) => updateProduct(index, 'model', e.target.value)}
            />
            <button
              type="button"
              className="remove-btn"
              onClick={() => removeProduct(index)}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className="add-product-btn"
          onClick={addProduct}
        >
          + Ürün Ekle
        </button>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="gdpr_consent"
            checked={formData.gdpr_consent}
            onChange={onInputChange}
            required
          />
          <span>
            GDPR şartlarını ve koşullarını kabul ediyorum
          </span>
        </label>
        {errors.gdpr_consent && <span className="field-error">{errors.gdpr_consent}</span>}
      </div>

      <ErrorMessage message={errors.submit} />

      <div className="form-actions">
        <AuthButton type="button" onClick={onBack} className="secondary">
          Geri
        </AuthButton>
        <AuthButton type="submit" loading={loading}>
          Hesap Oluştur
        </AuthButton>
      </div>
    </motion.div>
  )
}

export default Step3AdditionalDetails

