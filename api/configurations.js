// Vercel serverless function for configurations API
const { v4: uuidv4 } = require('uuid');

// In-memory storage for demo purposes (will reset on deployment)
// For production, you would connect to a persistent database
let configurations = [
  {
    id: "demo-config-1",
    client_name: "Demo Company A",
    configuration_data: {
      clientName: "Demo Company A",
      reportingCadence: {
        frequency: "weekly",
        dayOfWeek: "monday",
        dayOfMonth: "1"
      },
      populations: [
        {
          id: "demo-pop-1",
          name: "Full-time Employees",
          description: "All full-time staff members",
          claimSubmissionWindow: "180",
          runoutPeriod: "180",
          launchDate: "2025-01-01",
          endDate: "2025-12-31",
          categories: [
            {
              id: "demo-cat-1",
              name: "Family Building",
              format: "currency",
              structure: "lifetime",
              amounts: { lifetime: "10000" },
              startDate: "2025-01-01",
              endDate: "2025-12-31",
              expenseTypes: [
                {
                  id: "demo-exp-1",
                  name: "fertility",
                  configuration: {
                    expenseCategory: "fertility",
                    historicalSpendSupported: false,
                    userLevel: "household",
                    reimbursementMethod: "payroll",
                    startDate: "2025-01-01",
                    endDate: "2025-12-31",
                    eligibility: {
                      type: "anyone-on-file"
                    },
                    taxation: {
                      type: "standard"
                    }
                  }
                }
              ]
            }
          ]
        }
      ],
      status: "completed",
      timestamp: new Date().toISOString()
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: "demo-config-2", 
    client_name: "Demo Company B",
    configuration_data: {
      clientName: "Demo Company B",
      reportingCadence: {
        frequency: "monthly",
        dayOfWeek: "monday",
        dayOfMonth: "15"
      },
      populations: [
        {
          id: "demo-pop-2",
          name: "Executive Team",
          description: "C-level and VP positions",
          claimSubmissionWindow: "365",
          runoutPeriod: "365",
          launchDate: "2025-01-01",
          endDate: "2025-12-31",
          categories: [
            {
              id: "demo-cat-2",
              name: "Comprehensive Benefits",
              format: "currency",
              structure: "lifetime",
              amounts: { lifetime: "25000" },
              startDate: "2025-01-01",
              endDate: "2025-12-31",
              expenseTypes: [
                {
                  id: "demo-exp-2",
                  name: "adoption",
                  configuration: {
                    expenseCategory: "adoption",
                    historicalSpendSupported: true,
                    userLevel: "household",
                    reimbursementMethod: "direct-deposit",
                    startDate: "2025-01-01",
                    endDate: "2025-12-31",
                    eligibility: {
                      type: "custom",
                      tenureRequirement: "90-days",
                      benefitsEligible: true
                    },
                    taxation: {
                      type: "custom",
                      nonTaxPartnerTaxation: "not-taxed",
                      internationalTaxation: "taxed"
                    }
                  }
                }
              ]
            }
          ]
        }
      ],
      status: "completed",
      timestamp: new Date().toISOString()
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const configId = req.query.id;

  try {
    switch (method) {
      case 'GET':
        if (configId) {
          // Get specific configuration
          const config = configurations.find(c => c.id === configId);
          if (!config) {
            return res.status(404).json({ error: 'Configuration not found' });
          }
          res.json(config);
        } else {
          // Get all configurations
          res.json(configurations);
        }
        break;

      case 'POST':
        // Create new configuration
        const newConfig = {
          id: uuidv4(),
          client_name: req.body.clientName,
          configuration_data: req.body,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        configurations.push(newConfig);
        res.status(201).json({ 
          message: 'Configuration saved successfully', 
          id: newConfig.id 
        });
        break;

      case 'PUT':
        // Update existing configuration
        const configIndex = configurations.findIndex(c => c.id === configId);
        if (configIndex === -1) {
          return res.status(404).json({ error: 'Configuration not found' });
        }
        
        configurations[configIndex] = {
          ...configurations[configIndex],
          client_name: req.body.clientName,
          configuration_data: req.body,
          updated_at: new Date().toISOString()
        };
        
        res.json({ message: 'Configuration updated successfully' });
        break;

      case 'DELETE':
        // Delete configuration
        const deleteIndex = configurations.findIndex(c => c.id === configId);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Configuration not found' });
        }
        
        configurations.splice(deleteIndex, 1);
        res.json({ message: 'Configuration deleted successfully' });
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};