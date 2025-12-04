function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="step-indicator">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className={`step ${step <= currentStep ? 'active' : ''}`}>
          <div className="step-number">{step}</div>
          {step < totalSteps && <div className="step-line"></div>}
        </div>
      ))}
    </div>
  )
}

export default StepIndicator

