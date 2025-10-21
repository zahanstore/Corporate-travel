exports.handler = async function(event, context) {
  console.log('🚀 Function started');
  
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    const formData = JSON.parse(event.body);
    console.log('📝 Received form data');

    // Check environment variables
    if (!process.env.AIRTABLE_ACCESS_TOKEN || !process.env.AIRTABLE_BASE_ID) {
      throw new Error('Missing environment variables');
    }

    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`;
    
    // FIRST: Let's discover what fields actually exist in your Airtable
    console.log('🔍 Discovering available fields in Airtable...');
    
    const listResponse = await fetch(airtableUrl + '?maxRecords=1', {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
      }
    });

    const listResult = await listResponse.json();
    
    if (!listResponse.ok) {
      throw new Error(`Airtable connection failed: ${listResult.error?.message}`);
    }

    // Get the actual field names from your Airtable
    const actualFields = listResult.records[0]?.fields ? Object.keys(listResult.records[0].fields) : [];
    
    console.log('🎯 ACTUAL FIELDS IN YOUR AIRTABLE:', actualFields);
    console.log('📋 We are trying to use these fields:', [
      'Name', 'Email', 'Phone', 'Company Name', 'Pickup Location', 
      'Destination', 'Date', 'Time', 'Service Type', 'Service Subtype',
      'Guests', 'Status', 'Notes', 'Addons'
    ]);

    // Return the actual field names so we can see them
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Field discovery completed',
        yourActualFields: actualFields,
        fieldsWeAreTryingToUse: [
          'Name', 'Email', 'Phone', 'Company Name', 'Pickup Location', 
          'Destination', 'Date', 'Time', 'Service Type', 'Service Subtype',
          'Guests', 'Status', 'Notes', 'Addons'
        ]
      })
    };

  } catch (error) {
    console.error('💥 Error:', error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Discovery error: ' + error.message
      })
    };
  }
};
