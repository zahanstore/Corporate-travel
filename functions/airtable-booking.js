exports.handler = async function(event, context) {
  try {
    const formData = JSON.parse(event.body);
    
    const airtableData = {
      records: [{
        fields: {
          'Customer Name': formData.name,
          'Customer Email': formData.email,
          'Customer Phone': formData.phone,
          'Company': formData.company,
          'Service Category': getServiceCategory(formData.service),
          'Service Type': formData.service_subtype || 'One Way',
          'Pickup Location': formData.pickup,
          'Dropoff Location': formData.destination,
          'Pickup Date': formData.date,
          'Pickup Time': formData.time,
          'Number of Guests': parseInt(formData.guests) || 1,
          'Status': 'Inquired',
          'Addons': formData.addons || [],
          'Special Requests': formData.message || 'No special requests',
          'Total Amount': 0 // Add pricing logic later in table
        }
      }]
    };

    const response = await fetch(`https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Bookings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(airtableData)
    });

    const result = await response.json();
    
    if (!response.ok) throw new Error(JSON.stringify(result.error));

    return {
      statusCode: 200,
      headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        success: true, 
        message: '✅ Booking created successfully!',
        recordId: result.records[0].id
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
      body: JSON.stringify({ 
        success: false,
        error: 'Failed: ' + error.message
      })
    };
  }
};

function getServiceCategory(service) {
  const map = {
    'airport-transfers': 'Airport',
    'event-transportation': 'Corporate',
    'executive-car': 'Point-to-Point',
    'roadshow-tours': 'Tours', 
    'hourly-services': 'Rental'
  };
  return map[service] || 'General';
}
