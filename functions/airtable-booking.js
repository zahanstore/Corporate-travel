exports.handler = async function(event, context) {
  console.log('🚀 Function started - Method:', event.httpMethod);
  
  // Handle CORS preflight requests
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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  }

  try {
    console.log('📝 Parsing form data...');
    
    if (!event.body) {
      throw new Error('No body received');
    }
    
    const formData = JSON.parse(event.body);
    console.log('✅ Form data parsed successfully');
    
    // Check environment variables
    console.log('🔍 Checking environment variables...');
    if (!process.env.AIRTABLE_ACCESS_TOKEN) {
      throw new Error('AIRTABLE_ACCESS_TOKEN environment variable is not set');
    }
    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_BASE_ID environment variable is not set');
    }
    console.log('✅ Environment variables check passed');

    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`;
    console.log('📤 Airtable URL:', airtableUrl.replace(process.env.AIRTABLE_ACCESS_TOKEN, 'HIDDEN'));
    
    // Prepare the data for Airtable
    const airtableData = {
      records: [
        {
          fields: {
            'Name': formData.name || 'Not provided',
            'Email': formData.email || 'Not provided',
            'Phone': formData.phone || 'Not provided',
            'Company Name': formData.company || 'Not provided',
            'Pickup Location': formData.pickup || 'Not provided',
            'Destination': formData.destination || 'Not provided',
            'Date': formData.date || 'Not provided',
            'Time': formData.time || 'Not provided',
            'Service Type': formData.service || 'Not provided',
            'Service Subtype': formData.service_subtype || 'Not selected',
            'Guests': parseInt(formData.guests) || 1,
            'Status': 'Inquired',
            'Notes': formData.message || 'No message',
            'Addons': formData.addons ? formData.addons.join(', ') : 'None'
          }
        }
      ]
    };

    console.log('📦 Data prepared for Airtable');
    
    // Make the API call to Airtable
    console.log('🔄 Making API call to Airtable...');
    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtableData)
    });

    console.log('📨 Airtable response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Airtable API error:', errorText);
      throw new Error(`Airtable API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Airtable record created successfully!');
    console.log('📝 Record ID:', result.records[0].id);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: true, 
        message: 'Booking submitted successfully!',
        recordId: result.records[0].id
      })
    };

  } catch (error) {
    console.error('💥 FUNCTION ERROR:', error.message);
    console.error('Stack:', error.stack);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        success: false,
        error: 'Failed to create booking: ' + error.message
      })
    };
  }
};
