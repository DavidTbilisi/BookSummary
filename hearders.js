(function() {
    function createOutline() {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const outlineContainer = document.createElement('div');
      outlineContainer.id = 'outline';
      const list = document.createElement('ul');
  
      headings.forEach((heading, index) => {
        // Add an ID to each heading if it doesn't have one
        if (!heading.id) {
          heading.id = `heading-${index}`;
        }
  
        const listItem = document.createElement('li');
        listItem.style.marginLeft = `${(parseInt(heading.tagName[1], 10) - 1) * 20}px`;
  
        const link = document.createElement('a');
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent;
  
        listItem.appendChild(link);
        list.appendChild(listItem);
      });
  
      outlineContainer.appendChild(list);
      document.body.insertBefore(outlineContainer, document.body.firstChild);
    }
  
    document.addEventListener('DOMContentLoaded', createOutline);
  })();
  