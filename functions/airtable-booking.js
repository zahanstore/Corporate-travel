exports.handler = async function(event, context) {
  console.log('Function started - Method:', event.httpMethod);
  
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
    console.log('Parsing form data...');
    const formData = JSON.parse(event.body);
    console.log('Form data received:', JSON.stringify(formData, null, 2));
    
    // Check if environment variables are set
    if (!process.env.AIRTABLE_ACCESS_TOKEN) {
      throw new Error('AIRTABLE_ACCESS_TOKEN environment variable is not set');
    }
    if (!process.env.AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_BASE_ID environment variable is not set');
    }

    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`;
    console.log('Airtable URL:', airtableUrl);
    
    // Prepare the data for Airtable
    const airtableData = {
      records: [
        {
          fields: {
            'Customer Name': formData.name || 'Not provided',
            'Email': formData.email || 'Not provided',
            'Phone': formData.phone || 'Not provided',
            'Company': formData.company || 'Not provided',
            'Pickup Location': formData.pickup || 'Not provided',
            'Destination': formData.destination || 'Not provided', 
            'Date': formData.date || 'Not provided',
            'Time': formData.time || 'Not provided',
            'Service Type': formData.service || 'Not provided',
            'Service Subtype': formData.service_subtype || '',
            'Guests': parseInt(formData.guests) || 1,
            'Status': 'Inquired',
            'Notes': formData.message || 'No message',
            'Addons': formData.addons ? formData.addons.join(', ') : 'None'
          }
        }
      ]
    };

    console.log('Sending to Airtable:', JSON.stringify(airtableData, null, 2));
    
    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtableData)
    });

    const result = await response.json();
    console.log('Airtable response status:', response.status);
    console.log('Airtable response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('Airtable API error:', result);
      throw new Error(result.error?.message || `Airtable API error: ${response.status}`);
    }

    console.log('✅ Airtable record created successfully:', result.records[0].id);

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
    console.error('❌ Function error:', error.message);
    console.error('Error stack:', error.stack);
    
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
