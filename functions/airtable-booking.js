exports.handler = async function(event, context) {
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
    const formData = JSON.parse(event.body);
    
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`;
    
    console.log('Sending to Airtable:', formData);
    
    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              'Customer Name': formData.name || 'Not provided',
              'Email': formData.email || 'Not provided',
              'Phone': formData.phone || 'Not provided',
              'Pickup Location': formData.pickup || 'Not provided',
              'Destination': formData.destination || 'Not provided', 
              'Date': formData.date || 'Not provided',
              'Time': formData.time || 'Not provided',
              'Service Type': formData.service || 'Not provided',
              'Guests': parseInt(formData.guests) || 1,
              'Status': 'Inquired',
              'Notes': formData.message || 'No message'
            }
          }
        ]
      })
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Airtable API error:', result);
      throw new Error(result.error?.message || 'Airtable API error');
    }

    console.log('Airtable record created:', result.records[0].id);

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
    console.error('Function error:', error);
    
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
