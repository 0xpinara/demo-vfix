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
      <h2>Additional Details</h2>

      <div className="form-group">
        <label htmlFor="referral_source">How did you hear about us?</label>
        <select
          id="referral_source"
          name="referral_source"
          value={formData.referral_source}
          onChange={onInputChange}
        >
          <option value="">Select an option</option>
          <option value="google">Google Search</option>
          <option value="social">Social Media</option>
          <option value="friend">Friend/Family</option>
          <option value="ad">Advertisement</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <FiTool className="input-icon" />
          Available Tools
        </label>
        <div className="tools-grid">
          {['screwdriver', 'multimeter', 'wrench', 'pliers', 'drill', 'soldering iron'].map((tool) => (
            <button
              key={tool}
              type="button"
              className={`tool-chip ${formData.available_tools.includes(tool) ? 'active' : ''}`}
              onClick={() => toggleTool(tool)}
            >
              {formData.available_tools.includes(tool) && <FiCheck />}
              {tool}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>
          <FiPackage className="input-icon" />
          Owned Products
        </label>
        {formData.owned_products.map((product, index) => (
          <div key={index} className="product-row">
            <input
              type="text"
              placeholder="Brand"
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
          + Add Product
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
            I agree to the GDPR terms and conditions and privacy policy
          </span>
        </label>
        {errors.gdpr_consent && <span className="field-error">{errors.gdpr_consent}</span>}
      </div>

      <ErrorMessage message={errors.submit} />

      <div className="form-actions">
        <AuthButton type="button" onClick={onBack} className="secondary">
          Back
        </AuthButton>
        <AuthButton type="submit" loading={loading}>
          Create Account
        </AuthButton>
      </div>
    </motion.div>
  )
}

export default Step3AdditionalDetails

