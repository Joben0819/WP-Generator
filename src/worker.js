const axios = require('axios');
const cheerio = require('cheerio');
const { workerData, parentPort } = require('worker_threads');
import { errorLogs } from 'index';

// Function to generate content using OpenAI API
const generatePostOpenAI = async (keyword) => {
  const format = `
    <h1 id="post-title" style="display:none">{title}</h1>
    <p>{content1}</p>
    <p>{content2}</p>
    <p>{content3}</p>
    
    <h2>{list title}</h2>
    <ul>
      <li>{list1}</li>
      <li>{list2}</li>
      <li>{list3}</li>
      <li>{list4}</li>
      <li>{list5}</li>
      <li>{list6}</li>
      <li>{list7}</li>
      <li>{list8}</li>
    </ul>
    
    <h2>{other}</h2>
    <p>{content1}</p>
    <p>{content2}</p>
   
    <h2>{other}</h2>
    <p>{summary}</p>
    `;

  const openAIKey = 'sk-UVEsNtkbVsVbjqsWzCMg5ifQqGtw5ZqudoWJ6jFbMUuYQwpQ';
  try {
    const response = await axios.post(
      'https://api.deepbricks.ai/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a Web content specialist who writes SEO Optimized articles.',
          },
          {
            role: 'user',
            content: `Generate a post related to ${keyword} using indonesian language, then use this format ${format} and return html code only then remove triple backticks.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAIKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    errorLogs(keyword);
    // console.log(error, 'responseAIError');
  }
};

// Function to publish content to WordPress
const createWordPressPost = async (post, auth) => {
  try {
    const content = await generatePostOpenAI(post.Name);

    const $ = cheerio.load(content || '');
    const postTitle = $('#post-title').text();

    if (!content) return;

    const res = await axios.post(
      `${post.Url}/wp-json/wp/v2/posts`,
      {
        title: postTitle,
        content: `${content}
          <!-- wp:html -->
  
          <script>
               const schemaScript = document.createElement('script');
               schemaScript.type = 'application/ld+json';
               const lowPrice = Math.floor(100000 + Math.random() * 999999);
               const highPrice = Math.floor(lowPrice + Math.random() * (999999 - (lowPrice - 100000)));
  
              var title = document.querySelector('#post-title').textContent;
              const schema = {
                  "@context": "https://schema.org/",
                  "@type": "Product",
                  "name": title,
                  "brand": {
                    "@type": "Brand",
                    "name": title
                  },
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "5",
                    "ratingCount": Math.floor(100000 + Math.random() * 9999999)
                  },
                  "offers": {
                    "@type": "AggregateOffer",
                    "lowPrice": lowPrice,
                    "highPrice": highPrice,
                    "priceCurrency": "IDR"
                  }
                }
                schemaScript.innerHTML = JSON.stringify(schema);
                document.body.appendChild(schemaScript);
          </script>
         
          <!-- /wp:html -->`,
        status: 'publish',
      },

      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
      }
    );

    console.log('Post created successfully:', post.Name);
    return {
      id: res.data.id,
      name: post.Name,
      isExist: false,
    };
  } catch (error) {
    console.error(`Error creating post for item ${post.Name}:`, error);
  }
};

// Main worker function
const main = async () => {
  try {
    const { post, auth } = workerData;
    const publishedPost = await createWordPressPost(post, auth);
    parentPort.postMessage(publishedPost);
  } catch (error) {
    parentPort.postMessage({ error });
  }
};

main();
