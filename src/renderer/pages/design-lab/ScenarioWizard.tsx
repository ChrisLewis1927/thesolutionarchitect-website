// Architecture Design Lab — Scenario Intake Wizard UI
// Implements: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDesignLabStore } from '../../stores/design-lab-store';

const STEPS = [
  { id: 'cloudPlatforms', label: 'Cloud Platforms' },
  { id: 'serviceType', label: 'Service Type' },
  { id: 'userBase', label: 'User Base' },
  { id: 'trafficProfile', label: 'Traffic Profile' },
  { id: 'dataSensitivity', label: 'Data Sensitivity' },
  { id: 'availability', label: 'Availability' },
  { id: 'recovery', label: 'Recovery' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'teamCapability', label: 'Team Capability' },
  { id: 'constraints', label: 'Constraints' },
  { id: 'nfrs', label: 'NFRs' },
];

export default function ScenarioWizard() {
  const { scenarioId } = useParams<{ scenarioId: string }>();
  const navigate = useNavigate();
  const { currentStep, setCurrentStep, wizardData, updateWizardData, setCurrentScenarioId, validationErrors, setValidationErrors } = useDesignLabStore();
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(scenarioId ?? null);
  const [loading, setLoading] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [showNameInput, setShowNameInput] = useState(!scenarioId || scenarioId === 'new');

  useEffect(() => {
    if (scenarioId && scenarioId !== 'new') {
      loadScenario(scenarioId);
    }
  }, [scenarioId]);

  async function loadScenario(id: string) {
    try {
      const result = await (window as any).archlens.designLab.getScenario(id);
      if (result.success) {
        setActiveScenarioId(id);
        setCurrentScenarioId(id);
        setShowNameInput(false);
        // Load step data into store
        const steps = result.data.steps;
        for (const [key, value] of Object.entries(steps)) {
          updateWizardData(key, value);
        }
      }
    } catch (err) {
      console.error('Failed to load scenario:', err);
    }
  }

  async function handleCreateScenario() {
    if (!scenarioName.trim()) return;
    try {
      const result = await (window as any).archlens.designLab.createScenario(scenarioName);
      if (result.success) {
        const newId = result.data.id;
        setActiveScenarioId(newId);
        setCurrentScenarioId(newId);
        setShowNameInput(false);
        // Navigate to the URL with the new scenario ID so it persists
        navigate(`/design-lab/wizard/${newId}`, { replace: true });
      }
    } catch (err) {
      console.error('Failed to create scenario:', err);
    }
  }

  async function handleSaveStep() {
    if (!activeScenarioId) return;
    const stepId = STEPS[currentStep].id;
    const data = wizardData[stepId] ?? {};

    try {
      const result = await (window as any).archlens.designLab.saveScenarioStep(activeScenarioId, stepId, data);
      if (result.success) {
        if (!result.data.isValid) {
          setValidationErrors(stepId, result.data.errors.map((e: any) => e.message));
        } else {
          setValidationErrors(stepId, []);
        }
        return result.data.isValid;
      }
    } catch (err) {
      console.error('Failed to save step:', err);
    }
    return false;
  }

  async function handleNext() {
    await handleSaveStep();
    // Always allow advancing — validation errors are shown but don't block
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function handleRunAssessment() {
    if (!activeScenarioId) {
      setValidationErrors('assessment', ['No scenario found. Please go back and start a new scenario.']);
      return;
    }
    // Save the current (last) step first
    await handleSaveStep();
    setLoading(true);
    setValidationErrors('assessment', []);
    try {
      const result = await (window as any).archlens.designLab.runAssessment(activeScenarioId);
      if (result.success) {
        navigate(`/design-lab/assessment/${result.data.id}`);
      } else {
        setValidationErrors('assessment', [result.error?.userMessage ?? 'Assessment failed. Please check all fields are complete.']);
      }
    } catch (err: any) {
      setValidationErrors('assessment', [`Failed to run assessment: ${err?.message ?? 'Unknown error'}`]);
    } finally {
      setLoading(false);
    }
  }

  // Name input screen
  if (showNameInput) {
    return (
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={() => navigate('/design-lab')} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>
          ← Back to Design Lab
        </button>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1a1a2e', marginBottom: '1rem' }}>Name Your Scenario</h1>
        <input
          type="text"
          value={scenarioName}
          onChange={(e) => setScenarioName(e.target.value)}
          placeholder="e.g., Citizen Licence Application Service"
          style={{ width: '100%', padding: '0.7rem 1rem', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem' }}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateScenario()}
        />
        <button onClick={handleCreateScenario} disabled={!scenarioName.trim()} style={{ padding: '0.7rem 1.2rem', background: scenarioName.trim() ? '#4a6cf7' : '#94a3b8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.9rem', cursor: scenarioName.trim() ? 'pointer' : 'not-allowed' }}>
          Start Scenario
        </button>
      </div>
    );
  }

  const currentStepConfig = STEPS[currentStep];
  const stepErrors = validationErrors[currentStepConfig.id] ?? [];

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate('/design-lab')} style={{ background: 'none', border: 'none', color: '#4a6cf7', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem' }}>
        ← Back to Design Lab
      </button>

      {/* Progress bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>Step {currentStep + 1} of {STEPS.length}</span>
          <span style={{ fontSize: '0.8rem', color: '#666' }}>{currentStepConfig.label}</span>
        </div>
        <div style={{ height: '4px', background: '#e0e0e0', borderRadius: '2px' }}>
          <div style={{ height: '100%', width: `${((currentStep + 1) / STEPS.length) * 100}%`, background: '#4a6cf7', borderRadius: '2px', transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {STEPS.map((step, i) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(i)}
            style={{
              padding: '0.2rem 0.5rem',
              background: i === currentStep ? '#4a6cf7' : i < currentStep ? '#d1fae5' : '#f1f5f9',
              color: i === currentStep ? '#fff' : i < currentStep ? '#065f46' : '#666',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.7rem',
              cursor: 'pointer',
              fontWeight: i === currentStep ? 600 : 400,
            }}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div style={{ padding: '1.5rem', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', marginBottom: '1.5rem', minHeight: '200px' }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a1a2e', marginBottom: '1rem' }}>
          {currentStepConfig.label}
        </h2>
        <StepContent
          stepId={currentStepConfig.id}
          data={wizardData[currentStepConfig.id] ?? {}}
          onChange={(data) => updateWizardData(currentStepConfig.id, data)}
        />
        {stepErrors.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            {stepErrors.map((err, i) => (
              <p key={i} style={{ color: '#dc2626', fontSize: '0.8rem', margin: '0.2rem 0' }}>⚠️ {err}</p>
            ))}
          </div>
        )}
        {(validationErrors['assessment'] ?? []).length > 0 && (
          <div style={{ marginTop: '1rem', padding: '0.6rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px' }}>
            {(validationErrors['assessment'] ?? []).map((err, i) => (
              <p key={i} style={{ color: '#991b1b', fontSize: '0.85rem', margin: '0.2rem 0' }}>❌ {err}</p>
            ))}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleBack} disabled={currentStep === 0} style={{ padding: '0.6rem 1rem', background: '#fff', color: currentStep === 0 ? '#ccc' : '#333', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '0.85rem', cursor: currentStep === 0 ? 'not-allowed' : 'pointer' }}>
          ← Previous
        </button>
        {currentStep < STEPS.length - 1 ? (
          <button onClick={handleNext} style={{ padding: '0.6rem 1rem', background: '#4a6cf7', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 500 }}>
            Next →
          </button>
        ) : (
          <button onClick={handleRunAssessment} disabled={loading} style={{ padding: '0.6rem 1rem', background: loading ? '#94a3b8' : '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 500 }}>
            {loading ? 'Running...' : 'Run Assessment ✓'}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Content — proper form fields for all 12 wizard steps
// ---------------------------------------------------------------------------

const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '0.75rem' };
const selectStyle = { ...inputStyle };
const labelStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' } as const;
const hintStyle = { fontSize: '0.85rem', color: '#666', marginBottom: '0.75rem' };

function StepContent({ stepId, data, onChange }: { stepId: string; data: any; onChange: (data: any) => void }) {
  switch (stepId) {
    case 'cloudPlatforms':
      return (
        <div>
          <p style={hintStyle}>Which cloud platforms does your organisation have access to?</p>
          {['aws', 'azure', 'gcp'].map((platform) => (
            <label key={platform} style={labelStyle}>
              <input
                type="checkbox"
                checked={(data.availablePlatforms ?? []).includes(platform)}
                onChange={(e) => {
                  const platforms = data.availablePlatforms ?? [];
                  onChange({ ...data, availablePlatforms: e.target.checked ? [...platforms, platform] : platforms.filter((p: string) => p !== platform), noCloudAvailable: false });
                }}
              />
              {platform.toUpperCase()}
            </label>
          ))}
          <label style={{ ...labelStyle, marginTop: '0.75rem' }}>
            <input type="checkbox" checked={data.noCloudAvailable ?? false} onChange={(e) => onChange({ ...data, noCloudAvailable: e.target.checked, availablePlatforms: [] })} />
            No cloud account available
          </label>
          <input type="text" value={data.notes ?? ''} onChange={(e) => onChange({ ...data, notes: e.target.value })} placeholder="Any notes about platform access (optional)" style={{ ...inputStyle, marginTop: '0.75rem' }} />
        </div>
      );

    case 'serviceType':
      return (
        <div>
          <p style={hintStyle}>What type of service are you designing?</p>
          <select value={data.type ?? ''} onChange={(e) => onChange({ ...data, type: e.target.value })} style={selectStyle}>
            <option value="">Select...</option>
            <option value="public-facing">Public-facing citizen service</option>
            <option value="internal">Internal line-of-business</option>
            <option value="api-service">API service</option>
            <option value="batch-processing">Batch processing</option>
            <option value="data-platform">Data platform</option>
            <option value="integration-layer">Integration layer</option>
            <option value="other">Other</option>
          </select>
          <input type="text" value={data.description ?? ''} onChange={(e) => onChange({ ...data, description: e.target.value })} placeholder="Brief description of the service" style={inputStyle} />
        </div>
      );

    case 'userBase':
      return (
        <div>
          <p style={hintStyle}>How many users do you expect to use this service?</p>
          <select value={data.expectedUsers ?? ''} onChange={(e) => onChange({ ...data, expectedUsers: e.target.value })} style={selectStyle}>
            <option value="">Select expected user base...</option>
            <option value="under-100">Under 100 users</option>
            <option value="100-1000">100 – 1,000 users</option>
            <option value="1000-10000">1,000 – 10,000 users</option>
            <option value="10000-100000">10,000 – 100,000 users</option>
            <option value="over-100000">Over 100,000 users</option>
          </select>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>User types (comma-separated)</label>
          <input type="text" defaultValue={(data.userTypes ?? []).join(', ')} onBlur={(e) => onChange({ ...data, userTypes: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="e.g., citizens, case workers, administrators" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Peak usage pattern (optional)</label>
          <input type="text" value={data.peakUsagePattern ?? ''} onChange={(e) => onChange({ ...data, peakUsagePattern: e.target.value })} placeholder="e.g., weekday mornings 9-11am, end of financial year" style={inputStyle} />
        </div>
      );

    case 'trafficProfile':
      return (
        <div>
          <p style={hintStyle}>What traffic pattern do you expect?</p>
          <select value={data.pattern ?? ''} onChange={(e) => onChange({ ...data, pattern: e.target.value })} style={selectStyle}>
            <option value="">Select traffic pattern...</option>
            <option value="steady">Steady — consistent load throughout the day</option>
            <option value="spiky">Spiky — sudden bursts of traffic</option>
            <option value="seasonal">Seasonal — predictable peaks at certain times of year</option>
            <option value="growing">Growing — steadily increasing over time</option>
            <option value="unpredictable">Unpredictable — no clear pattern</option>
          </select>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Peak description (optional)</label>
          <input type="text" value={data.peakDescription ?? ''} onChange={(e) => onChange({ ...data, peakDescription: e.target.value })} placeholder="e.g., 10x normal load during tax deadline week" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Estimated requests per second (optional)</label>
          <input type="number" value={data.estimatedRequestsPerSecond ?? ''} onChange={(e) => onChange({ ...data, estimatedRequestsPerSecond: e.target.value ? Number(e.target.value) : undefined })} placeholder="e.g., 50" style={inputStyle} />
        </div>
      );

    case 'dataSensitivity':
      return (
        <div>
          <p style={hintStyle}>What is the data sensitivity classification?</p>
          <select value={data.classification ?? ''} onChange={(e) => onChange({ ...data, classification: e.target.value })} style={selectStyle}>
            <option value="">Select classification...</option>
            <option value="official">OFFICIAL</option>
            <option value="official-sensitive">OFFICIAL-SENSITIVE</option>
            <option value="secret">SECRET</option>
            <option value="top-secret">TOP SECRET</option>
          </select>
          <label style={labelStyle}>
            <input type="checkbox" checked={data.containsPII ?? false} onChange={(e) => onChange({ ...data, containsPII: e.target.checked })} />
            Contains personal data (PII)
          </label>
          <label style={labelStyle}>
            <input type="checkbox" checked={data.containsSpecialCategory ?? false} onChange={(e) => onChange({ ...data, containsSpecialCategory: e.target.checked })} />
            Contains special category data (health, biometric, etc.)
          </label>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', marginTop: '0.5rem', color: '#333' }}>Retention requirements (optional)</label>
          <input type="text" value={data.retentionRequirements ?? ''} onChange={(e) => onChange({ ...data, retentionRequirements: e.target.value })} placeholder="e.g., 7 years for financial records" style={inputStyle} />
        </div>
      );

    case 'availability':
      return (
        <div>
          <p style={hintStyle}>What availability target does this service need?</p>
          <select value={data.targetAvailability ?? ''} onChange={(e) => onChange({ ...data, targetAvailability: e.target.value })} style={selectStyle}>
            <option value="">Select target availability...</option>
            <option value="99">99% (~87 hours downtime/year)</option>
            <option value="99.5">99.5% (~44 hours downtime/year)</option>
            <option value="99.9">99.9% (~8.7 hours downtime/year)</option>
            <option value="99.95">99.95% (~4.4 hours downtime/year)</option>
            <option value="99.99">99.99% (~52 minutes downtime/year)</option>
          </select>
          <label style={labelStyle}>
            <input type="checkbox" checked={data.maintenanceWindow ?? false} onChange={(e) => onChange({ ...data, maintenanceWindow: e.target.checked })} />
            Maintenance window is acceptable
          </label>
          {data.maintenanceWindow && (
            <input type="text" value={data.maintenanceWindowDetails ?? ''} onChange={(e) => onChange({ ...data, maintenanceWindowDetails: e.target.value })} placeholder="e.g., Sundays 02:00-06:00" style={inputStyle} />
          )}
        </div>
      );

    case 'recovery':
      return (
        <div>
          <p style={hintStyle}>What are the recovery requirements if the service fails?</p>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Recovery Time Objective (RTO) — how quickly must the service recover?</label>
          <select value={data.rto ?? ''} onChange={(e) => onChange({ ...data, rto: e.target.value })} style={selectStyle}>
            <option value="">Select RTO...</option>
            <option value="15 minutes">15 minutes</option>
            <option value="1 hour">1 hour</option>
            <option value="4 hours">4 hours</option>
            <option value="8 hours">8 hours</option>
            <option value="24 hours">24 hours</option>
            <option value="72 hours">72 hours</option>
          </select>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Recovery Point Objective (RPO) — how much data loss is acceptable?</label>
          <select value={data.rpo ?? ''} onChange={(e) => onChange({ ...data, rpo: e.target.value })} style={selectStyle}>
            <option value="">Select RPO...</option>
            <option value="zero">Zero (no data loss)</option>
            <option value="5 minutes">5 minutes</option>
            <option value="1 hour">1 hour</option>
            <option value="4 hours">4 hours</option>
            <option value="24 hours">24 hours</option>
          </select>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>DR Strategy (optional)</label>
          <select value={data.drStrategy ?? ''} onChange={(e) => onChange({ ...data, drStrategy: e.target.value || undefined })} style={selectStyle}>
            <option value="">Select DR strategy...</option>
            <option value="active-active">Active-Active (multi-region)</option>
            <option value="active-passive">Active-Passive (warm standby)</option>
            <option value="pilot-light">Pilot Light (minimal standby)</option>
            <option value="backup-restore">Backup & Restore</option>
          </select>
        </div>
      );

    case 'integrations':
      return (
        <div>
          <p style={hintStyle}>What external systems does this service integrate with? (Optional — leave blank if none)</p>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Integration protocols used</label>
          {['rest-api', 'soap', 'messaging', 'file-transfer', 'database', 'event-stream'].map((protocol) => (
            <label key={protocol} style={labelStyle}>
              <input
                type="checkbox"
                checked={(data.protocols ?? []).includes(protocol)}
                onChange={(e) => {
                  const protocols = data.protocols ?? [];
                  onChange({ ...data, protocols: e.target.checked ? [...protocols, protocol] : protocols.filter((p: string) => p !== protocol) });
                }}
              />
              {protocol.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </label>
          ))}
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', marginTop: '0.75rem', color: '#333' }}>Integration systems (comma-separated names)</label>
          <input type="text" defaultValue={(data.systems ?? []).map((s: any) => s.name ?? s).join(', ')} onBlur={(e) => onChange({ ...data, systems: e.target.value.split(',').map((s: string) => ({ name: s.trim(), type: 'external', protocol: 'rest-api', dataFlow: 'bidirectional' })).filter((s: any) => s.name) })} placeholder="e.g., Case Management System, Payment Gateway, Email Service" style={inputStyle} />
        </div>
      );

    case 'deployment':
      return (
        <div>
          <p style={hintStyle}>What deployment model do you prefer?</p>
          <select value={data.preference ?? ''} onChange={(e) => onChange({ ...data, preference: e.target.value })} style={selectStyle}>
            <option value="">Select deployment preference...</option>
            <option value="cloud-native">Cloud-native (PaaS/managed services)</option>
            <option value="containerised">Containerised (Docker/Kubernetes)</option>
            <option value="vm-based">VM-based (traditional infrastructure)</option>
            <option value="serverless">Serverless (Lambda/Functions)</option>
            <option value="hybrid">Hybrid (mix of approaches)</option>
            <option value="no-preference">No preference</option>
          </select>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Existing infrastructure (optional)</label>
          <input type="text" value={data.existingInfrastructure ?? ''} onChange={(e) => onChange({ ...data, existingInfrastructure: e.target.value })} placeholder="e.g., Existing Kubernetes cluster in AWS" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>CI/CD requirements (optional)</label>
          <input type="text" value={data.cicdRequirements ?? ''} onChange={(e) => onChange({ ...data, cicdRequirements: e.target.value })} placeholder="e.g., Must use Azure DevOps, deploy to multiple environments" style={inputStyle} />
        </div>
      );

    case 'teamCapability':
      return (
        <div>
          <p style={hintStyle}>Tell us about the team that will build and maintain this service.</p>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Team size</label>
          <select value={data.teamSize ?? ''} onChange={(e) => onChange({ ...data, teamSize: e.target.value })} style={selectStyle}>
            <option value="">Select team size...</option>
            <option value="solo">Solo (1 person)</option>
            <option value="small-2-5">Small (2–5 people)</option>
            <option value="medium-6-15">Medium (6–15 people)</option>
            <option value="large-16-plus">Large (16+ people)</option>
          </select>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Cloud experience level</label>
          <select value={data.cloudExperience ?? ''} onChange={(e) => onChange({ ...data, cloudExperience: e.target.value })} style={selectStyle}>
            <option value="">Select experience level...</option>
            <option value="none">None — no cloud experience</option>
            <option value="basic">Basic — some awareness</option>
            <option value="intermediate">Intermediate — have built cloud services</option>
            <option value="advanced">Advanced — deep cloud expertise</option>
          </select>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Relevant skills (comma-separated)</label>
          <input type="text" defaultValue={(data.relevantSkills ?? []).join(', ')} onBlur={(e) => onChange({ ...data, relevantSkills: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="e.g., Java, AWS, Kubernetes, Terraform" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Team constraints (optional)</label>
          <input type="text" value={data.constraints ?? ''} onChange={(e) => onChange({ ...data, constraints: e.target.value })} placeholder="e.g., Team is split across two time zones" style={inputStyle} />
        </div>
      );

    case 'constraints':
      return (
        <div>
          <p style={hintStyle}>Are there any constraints on this project? (All fields optional)</p>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Budget constraints</label>
          <input type="text" value={data.budgetConstraints ?? ''} onChange={(e) => onChange({ ...data, budgetConstraints: e.target.value })} placeholder="e.g., £50k annual cloud spend limit" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Timeline constraints</label>
          <input type="text" value={data.timelineConstraints ?? ''} onChange={(e) => onChange({ ...data, timelineConstraints: e.target.value })} placeholder="e.g., Must be live by April 2026" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Technology constraints (comma-separated)</label>
          <input type="text" defaultValue={(data.technologyConstraints ?? []).join(', ')} onBlur={(e) => onChange({ ...data, technologyConstraints: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="e.g., Must use .NET, cannot use open-source databases" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Organisational constraints (comma-separated)</label>
          <input type="text" defaultValue={(data.organisationalConstraints ?? []).join(', ')} onBlur={(e) => onChange({ ...data, organisationalConstraints: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="e.g., Must go through architecture review board" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Regulatory constraints (comma-separated)</label>
          <input type="text" defaultValue={(data.regulatoryConstraints ?? []).join(', ')} onBlur={(e) => onChange({ ...data, regulatoryConstraints: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="e.g., UK GDPR, PCI-DSS, FCA regulations" style={inputStyle} />
        </div>
      );

    case 'nfrs':
      return (
        <div>
          <p style={hintStyle}>Capture any known non-functional requirements. (All fields optional)</p>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Performance requirements</label>
          <input type="text" value={data.performanceRequirements ?? ''} onChange={(e) => onChange({ ...data, performanceRequirements: e.target.value })} placeholder="e.g., Page load under 2 seconds, API response under 500ms" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Security requirements</label>
          <input type="text" value={data.securityRequirements ?? ''} onChange={(e) => onChange({ ...data, securityRequirements: e.target.value })} placeholder="e.g., MFA required, data encrypted at rest and in transit" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Compliance requirements</label>
          <input type="text" value={data.complianceRequirements ?? ''} onChange={(e) => onChange({ ...data, complianceRequirements: e.target.value })} placeholder="e.g., Must pass GDS service assessment, WCAG 2.1 AA" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Accessibility requirements</label>
          <input type="text" value={data.accessibilityRequirements ?? ''} onChange={(e) => onChange({ ...data, accessibilityRequirements: e.target.value })} placeholder="e.g., WCAG 2.1 AA, screen reader compatible" style={inputStyle} />
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '0.3rem', color: '#333' }}>Other requirements</label>
          <input type="text" value={data.otherRequirements ?? ''} onChange={(e) => onChange({ ...data, otherRequirements: e.target.value })} placeholder="e.g., Must support Welsh language, offline capability" style={inputStyle} />
        </div>
      );

    default:
      return (
        <div>
          <p style={hintStyle}>Configure settings for this step.</p>
        </div>
      );
  }
}
