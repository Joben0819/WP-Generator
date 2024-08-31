import axios from "axios";
import cheerio from "cheerio";
import { errorKeyWordLog } from ".";
import { wpUrls } from "./const";
const chalk = require("chalk");

type PostType = {
  Name: string;
  Status: string;
  Content: string;
  Url: string;
  Username: string;
  Password: string;
};

type PostResponse = {
  id?: number;
  name: string;
  isExist: boolean;
};

let counter = 0;
let errorCount = 0;
let createdCount = 0;
let updatedCount = 0;
const createWordPressPost = async (
  post: PostType,
  auth: string,
  total: number
) => {
  try {
    // counter++;

    const validContent = await validateScripts(post.Url, counter + 1);

    if (validContent === 0) {
      const content = await generatePostOpenAI(post);

      const $ = cheerio.load(content || "");
      const postTitle = $("#post-title").text().replace("1. ", "");

      if (!content) return;
      const otherLinks = generateWordPressLinks();
      const res = await axios.post(
        `${post.Url}/wp-json/wp/v2/posts/${counter + 1}`,
        {
          title: postTitle || post.Name,
          content: `${content.replace('"`html', "")}
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
        <script>
         const listItems = ${JSON.stringify(otherLinks)}
          document.addEventListener("DOMContentLoaded", function(event) {
              const footer = document.getElementsByTagName('footer')[0];
              const wrapper = document.createElement('div');
              wrapper.style.display = 'block';
              wrapper.style.maxWidth = '1380px';
              wrapper.style.margin = '0 auto';
              wrapper.style.paddingTop = '50px';

              const ul = document.createElement('ul');
              ul.style.listStyleType = 'none';
              ul.style.display = 'flex';
              ul.style.gap = '20px';
              ul.style.flexWrap = 'wrap';
              ul.style.justifyContent = 'space-between';

              for (let i = 0; i < listItems.length; i++) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.textContent = listItems[i].title;
                a.href = 'https://' + listItems[i].url;
                li.appendChild(a);
                ul.appendChild(li);
              }

              wrapper.appendChild(ul);
              footer.prepend(wrapper);
          });
        </script>
        <!-- /wp:html -->`,
          status: "publish",
        },

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!res?.data?.id || res?.status > 201) {
        errorCount++;
        errorKeyWordLog(post);
        return;
      } else {
        counter++;
        updatedCount++;
      }

      console.log(chalk.bgBlue.bold("Post updated successfully:", post.Name));
      console.log(
        `created: ${chalk.green(createdCount)} updated: ${chalk.blue(
          updatedCount
        )} error: ${chalk.red(errorCount)} total: ${chalk.yellow(total)}`
      );

      return {
        id: res.data.id,
        name: post.Name,
        isExist: false,
      };
    } else if (validContent === 2) {
      const content = await generatePostOpenAI(post);

      const $ = cheerio.load(content || "");
      const postTitle = $("#post-title").text().replace("1. ", "");

      if (!content) return;
      const otherLinks = generateWordPressLinks();
      const res = await axios.post(
        `${post.Url}/wp-json/wp/v2/posts`,
        {
          title: postTitle || post.Name,
          content: `${content.replace('"`html', "")}
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
        <script>
         const listItems = ${JSON.stringify(otherLinks)}
          document.addEventListener("DOMContentLoaded", function(event) {
              const footer = document.getElementsByTagName('footer')[0];
              const wrapper = document.createElement('div');
              wrapper.style.display = 'block';
              wrapper.style.maxWidth = '1380px';
              wrapper.style.margin = '0 auto';
              wrapper.style.paddingTop = '50px';

              const ul = document.createElement('ul');
              ul.style.listStyleType = 'none';
              ul.style.display = 'flex';
              ul.style.gap = '20px';
              ul.style.flexWrap = 'wrap';
              ul.style.justifyContent = 'space-between';

              for (let i = 0; i < listItems.length; i++) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.textContent = listItems[i].title;
                a.href = 'https://' + listItems[i].url;
                li.appendChild(a);
                ul.appendChild(li);
              }

              wrapper.appendChild(ul);
              footer.prepend(wrapper);
          });
        </script>
        <!-- /wp:html -->`,
          status: "publish",
        },

        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      if (!res?.data?.id || res?.status > 201) {
        errorCount++;
        errorKeyWordLog(post);
        return;
      } else {
        counter++;
        createdCount++;
      }

      console.log(chalk.bgGreen.bold("Post created successfully:", post.Name));
      console.log(
        `created: ${chalk.green(createdCount)} updated: ${chalk.blue(
          updatedCount
        )} error: ${chalk.red(errorCount)} total: ${chalk.yellow(total)}`
      );

      return {
        id: res.data.id,
        name: post.Name,
        isExist: false,
      };
    } else {
      const skipTimeout = setTimeout(() => {
        counter++;
        console.log(chalk.bgWhite.bold("Post skip successfully:", post.Name));
        console.log(
          `created: ${chalk.green(createdCount)} updated: ${chalk.blue(
            updatedCount
          )} error: ${chalk.red(errorCount)} total: ${chalk.yellow(total)}`
        );

        clearTimeout(skipTimeout);

        return null;
      }, 20000);
    }
  } catch (error) {
    // console.log("wew!");
    errorKeyWordLog(post);
    // console.error(`Error creating post for item ${post.Name}:`, error);
  }
};

const validateScripts = async (url: string, id: number) => {
  try {
    const res = await axios.get(`${url}/wp-json/wp/v2/posts/${id}`);

    if (res?.status === 200) {
      if (
        res.data.content.rendered.includes(
          `schemaScript = document.createElement('script')`
        ) &&
        res.data.content.rendered.includes(
          `const footer = document.getElementsByTagName('footer')`
        )
      ) {
        return 1;
      } else {
        return 0;
      }
    } else {
      return 2;
    }
  } catch (_err) {
    return 2;
  }
};

const checkTitleExists = async (title: string, url: string, auth: string) => {
  try {
    // const response = await axios.get(`${url}/wp-json/wp/v2/posts`);
    //to do
    return 0;
  } catch (error) {
    console.error("Error checking title:", error);
    return false;
  }
};

const createPostWithTitleCheck = async (
  post: PostType,
  auth: string,
  total: number
) => {
  const titleExists = await checkTitleExists(post.Name, post.Url, auth);

  if (titleExists) {
    console.log(`\x1b[31mPost with title ${post.Name} already exists\x1b[0m`);

    return {
      name: post.Name,
      isExist: true,
    };
  }

  const response = await createWordPressPost(post, auth, total);
  return response || null;
};

const generatePostOpenAI = async (post: PostType) => {
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

  const openAIKey = "sk-UVEsNtkbVsVbjqsWzCMg5ifQqGtw5ZqudoWJ6jFbMUuYQwpQ";
  try {
    const response: any = await axios.post(
      "https://api.deepbricks.ai/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a Web content specialist who writes SEO Optimized articles.",
          },
          {
            role: "user",
            content: `Generate a post related to ${post.Name} using indonesian language, then use this format ${format} and return html code only then remove triple backticks.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAIKey}`,
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    errorKeyWordLog(post);
    // console.error(error);
  }
};

let selectedDomainChunk = 0;
const generateWordPressLinks = () => {
  const chunkSize = 50;
  const chunks = [];

  for (let i = 0; i < wpUrls.length; i += chunkSize) {
    chunks.push(wpUrls.slice(i, i + chunkSize));
  }
  const selectedChunk = chunks[selectedDomainChunk];

  const list = selectedChunk.map((domain) => {
    return `<li><a href="https://${domain.url}">${domain.title}</a></li>`;
  });

  selectedDomainChunk = (selectedDomainChunk + 1) % chunks.length;
  return selectedChunk;
  console.log(list.join(""));
  return list.join("");

  // return `<h2>Posting Terkait</h2><ul style="list-style-type:none, display:flex; flex-wrap:wrap; gap:20px">${list.join(
  //   ''
  // )}</ul>`;
};

export { createPostWithTitleCheck, PostResponse, PostType };
