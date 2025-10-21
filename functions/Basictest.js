exports.handler = async function(event, context) {
  console.log('🔧 Testing Airtable connection...');
  
  try {
    // Log environment variables (hidden for security)
    console.log('Base ID exists:', !!process.env.AIRTABLE_BASE_ID);
    console.log('Token exists:', !!process.env.AIRTABLE_ACCESS_TOKEN);
    console.log('Base ID:', process.env.AIRTABLE_BASE_ID);
    console.log('Token starts with:', process.env.AIRTABLE_ACCESS_TOKEN ? process.env.AIRTABLE_ACCESS_TOKEN.substring(0, 10) + '...' : 'None');
    
    if (!process.env.AIRTABLE_ACCESS_TOKEN) {
      throw new Error('AIRTABLE_ACCESS_TOKEN is missing');
    }
    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_BASE_ID is missing');
    }

    // Test the base connection
    const baseUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
    console.log('Testing URL:', baseUrl);
    
    const response = await fetch(baseUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
      }
    });

    const result = await response.json();
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.log('Error response:', result);
      throw new Error(result.error?.message || `HTTP ${response.status}`);
    }

    console.log('✅ Connection successful! Available tables:', result.tables?.map(t => t.name));
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: '✅ Airtable connection successful!',
        tables: result.tables ? result.tables.map(t => t.name) : ['No tables found']
      })
    };

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Connection failed: ' + error.message,
        suggestion: 'Please check: 1) Token permissions 2) Base ID 3) Token validity'
      })
    };
  }
};
