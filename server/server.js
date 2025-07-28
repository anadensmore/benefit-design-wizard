const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const Database = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Get all benefit configurations
app.get('/api/configurations', async (req, res) => {
    try {
        const configurations = await db.getAllConfigurations();
        res.json(configurations);
    } catch (error) {
        console.error('Error fetching configurations:', error);
        res.status(500).json({ error: 'Failed to fetch configurations' });
    }
});

// Get a specific configuration by ID
app.get('/api/configurations/:id', async (req, res) => {
    try {
        const configuration = await db.getConfigurationById(req.params.id);
        if (!configuration) {
            return res.status(404).json({ error: 'Configuration not found' });
        }
        res.json(configuration);
    } catch (error) {
        console.error('Error fetching configuration:', error);
        res.status(500).json({ error: 'Failed to fetch configuration' });
    }
});

// Save a new benefit configuration
app.post('/api/configurations', async (req, res) => {
    try {
        const configurationData = {
            id: uuidv4(),
            client_name: req.body.clientName,
            configuration_data: JSON.stringify(req.body),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        await db.saveConfiguration(configurationData);
        res.status(201).json({ 
            message: 'Configuration saved successfully', 
            id: configurationData.id 
        });
    } catch (error) {
        console.error('Error saving configuration:', error);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Update an existing configuration
app.put('/api/configurations/:id', async (req, res) => {
    try {
        const configurationData = {
            id: req.params.id,
            client_name: req.body.clientName,
            configuration_data: JSON.stringify(req.body),
            updated_at: new Date().toISOString()
        };

        const updated = await db.updateConfiguration(configurationData);
        if (!updated) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        res.json({ message: 'Configuration updated successfully' });
    } catch (error) {
        console.error('Error updating configuration:', error);
        res.status(500).json({ error: 'Failed to update configuration' });
    }
});

// Delete a configuration
app.delete('/api/configurations/:id', async (req, res) => {
    try {
        const deleted = await db.deleteConfiguration(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Configuration not found' });
        }

        res.json({ message: 'Configuration deleted successfully' });
    } catch (error) {
        console.error('Error deleting configuration:', error);
        res.status(500).json({ error: 'Failed to delete configuration' });
    }
});

// Serve the main app
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
});

module.exports = app;