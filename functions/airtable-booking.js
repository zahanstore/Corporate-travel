exports.handler = async function(event, context) {
  console.log('🚀 Airtable function started');
  
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
    console.log('📝 Received form data:', formData);

    // Check environment variables
    if (!process.env.AIRTABLE_ACCESS_TOKEN || !process.env.AIRTABLE_BASE_ID) {
      throw new Error('Missing environment variables');
    }

    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`;
    
    // Create clean data with only text fields (no linked records)
    const airtableData = {
      records: [
        {
          fields: {
            // Only use text fields from your Airtable
            'Customer': formData.name || 'Not provided',
            'Customer Email': formData.email || 'Not provided',
            'Pickup Location': formData.pickup || 'Not provided',
            'Dropoff Location': formData.destination || 'Not provided',
            'Pickup Date/Time': `${formData.date} ${formData.time}` || 'Not provided',
            'Service': formData.service || 'Not provided',
            'Status': 'Inquired',
            'Notes': `Phone: ${formData.phone || 'Not provided'} | Company: ${formData.company || 'Not provided'} | Guests: ${formData.guests || '1'} | Service Option: ${formData.service_subtype || 'Not selected'} | Addons: ${formData.addons?.join(', ') || 'None'} | Message: ${formData.message || 'No message'}`
            // Skip any linked record fields like 'Assigned Vehicle', 'Assigned Driver'
          }
        }
      ]
    };

    console.log('📤 Sending to Airtable:', JSON.stringify(airtableData, null, 2));

    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtableData)
    });

    const result = await response.json();
    console.log('📨 Airtable response status:', response.status);
    console.log('📨 Full response:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.error('Airtable error details:', result);
      
      // More detailed error message
      let errorMessage = result.error?.message || `Airtable API error: ${response.status}`;
      if (result.error?.type === 'UNKNOWN_FIELD_NAME') {
        errorMessage = `Field name error: ${result.error.message}. Check your Airtable field names.`;
      }
      
      throw new Error(errorMessage);
    }

    console.log('✅ Record created successfully! ID:', result.records[0].id);

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
    console.error('💥 Error:', error.message);
    
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
