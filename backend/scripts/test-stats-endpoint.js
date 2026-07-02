require('dotenv').config();
const defectService = require('../src/services/defectService');

async function test() {
  try {
    const stats = await defectService.getDashboardStats('admin', 1);
    console.log('Admin Stats:', JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

test();
