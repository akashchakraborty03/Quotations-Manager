document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search');
    const quotationsList = document.getElementById('quotations-list');
  
    // Fetch and display all quotations by default
    const fetchQuotations = async () => {
      const response = await fetch('/api/list');
      const data = await response.json();
      renderQuotations(data);
    };
  
    // Render quotations in the table
    const renderQuotations = (data) => {
      quotationsList.innerHTML = data
        .map(
          (quote) => `
          <tr>
            <td>${quote.date}</td>
            <td>${quote.reference_number}</td>
            <td>${quote.client_name}</td>
            <td>${quote.marketer_name}</td>
            <td><a href="/uploads/${quote.pdf_file}" target="_blank">View PDF</a></td>
          </tr>
        `
        )
        .join('');
    };
  
    // Filter quotations based on search input
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.toLowerCase();
      const response = await fetch(`/search?q=${query}`);
      const data = await response.json();
      renderQuotations(data);
    });
  
    // Fetch all quotations on page load
    fetchQuotations();
  });