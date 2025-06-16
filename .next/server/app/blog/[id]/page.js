(()=>{var e={};e.id=548,e.ids=[548],e.modules={5403:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external")},4749:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5528:e=>{"use strict";e.exports=require("next/dist\\client\\components\\action-async-storage.external.js")},1877:e=>{"use strict";e.exports=require("next/dist\\client\\components\\request-async-storage.external.js")},5319:e=>{"use strict";e.exports=require("next/dist\\client\\components\\static-generation-async-storage.external.js")},7835:(e,t,i)=>{"use strict";i.r(t),i.d(t,{GlobalError:()=>o.a,__next_app__:()=>h,originalPathname:()=>p,pages:()=>d,routeModule:()=>u,tree:()=>c});var s=i(7096),a=i(6132),r=i(7284),o=i.n(r),n=i(2564),l={};for(let e in n)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>n[e]);i.d(t,l);let c=["",{children:["blog",{children:["[id]",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(i.bind(i,850)),"D:\\WorkProjects\\Cursor\\TestSite\\src\\app\\blog\\[id]\\page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(i.bind(i,116)),"D:\\WorkProjects\\Cursor\\TestSite\\src\\app\\layout.tsx"],"not-found":[()=>Promise.resolve().then(i.t.bind(i,9291,23)),"next/dist/client/components/not-found-error"]}],d=["D:\\WorkProjects\\Cursor\\TestSite\\src\\app\\blog\\[id]\\page.tsx"],p="/blog/[id]/page",h={require:i,loadChunk:()=>Promise.resolve()},u=new s.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/blog/[id]/page",pathname:"/blog/[id]",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:c}})},3446:(e,t,i)=>{Promise.resolve().then(i.bind(i,7374))},7374:(e,t,i)=>{"use strict";i.r(t),i.d(t,{default:()=>BlogPostPage});var s=i(784);i(9885);var a=i(7114),r=i(2866),o=i(8445),n=i(2451),l=i.n(n),c=i(1440),d=i.n(c);let p=[{id:"nextjs-vs-react",title:"Next.js vs React: When to Choose Which",excerpt:"A comprehensive comparison of Next.js and React, discussing their strengths, weaknesses, and ideal use cases for different projects.",coverImage:"https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",date:"June 10, 2023",author:"John Doe",authorImage:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",readTime:"8 min read",tags:["React","Next.js","Frontend","JavaScript"],content:`
      <h2>Introduction</h2>
      <p>When starting a new React-based project, one of the first decisions you'll face is whether to use plain React or opt for a framework like Next.js. Both are powerful tools for building modern web applications, but they serve different needs and come with their own sets of advantages and trade-offs.</p>
      
      <p>In this article, we'll explore the key differences between React and Next.js, and provide guidance on when to choose one over the other based on your project requirements.</p>
      
      <h2>Understanding React</h2>
      <p>React is a JavaScript library for building user interfaces, particularly single-page applications. It allows developers to create reusable UI components and efficiently update the DOM when data changes, thanks to its virtual DOM implementation.</p>
      
      <h3>Key Features of React:</h3>
      <ul>
        <li><strong>Component-Based Architecture:</strong> React encourages building encapsulated components that manage their own state.</li>
        <li><strong>Virtual DOM:</strong> React's virtual DOM optimizes rendering performance by minimizing direct DOM manipulations.</li>
        <li><strong>JSX Syntax:</strong> JSX allows you to write HTML-like code within JavaScript, making component structure more readable.</li>
        <li><strong>One-Way Data Flow:</strong> Data flows down from parent to child components, making the application more predictable and easier to debug.</li>
      </ul>
      
      <h2>Understanding Next.js</h2>
      <p>Next.js is a React framework that provides additional structure, features, and optimizations. It's built on top of React and extends its capabilities with server-side rendering, static site generation, and more.</p>
      
      <h3>Key Features of Next.js:</h3>
      <ul>
        <li><strong>Server-Side Rendering (SSR):</strong> Next.js can render React components on the server before sending them to the client, improving SEO and initial load performance.</li>
        <li><strong>Static Site Generation (SSG):</strong> Pages can be pre-rendered at build time, resulting in extremely fast page loads and reduced server load.</li>
        <li><strong>File-Based Routing:</strong> Next.js uses a file-system based router, where each file in the pages directory automatically becomes a route.</li>
        <li><strong>API Routes:</strong> Next.js allows you to create API endpoints as part of your application, simplifying backend integration.</li>
        <li><strong>Built-in CSS and Sass Support:</strong> Next.js comes with built-in support for CSS and Sass, including CSS modules.</li>
        <li><strong>Image Optimization:</strong> The Image component automatically optimizes images for different devices and screen sizes.</li>
      </ul>
      
      <h2>When to Choose React</h2>
      <p>React might be the better choice in the following scenarios:</p>
      
      <h3>1. Simple Single-Page Applications</h3>
      <p>If you're building a simple SPA that doesn't require SEO, server-side rendering, or complex routing, plain React might be sufficient. Examples include internal tools, dashboards, or applications where all users are authenticated.</p>
      
      <h3>2. Integration with Existing Projects</h3>
      <p>If you're adding React to an existing application or only need to use React for specific parts of your site, using React directly gives you more flexibility without the overhead of a full framework.</p>
      
      <h3>3. Complete Control Over Project Structure</h3>
      <p>React doesn't impose any specific project structure or build configuration. If you prefer to set up your own build process, routing solution, and state management, React gives you that freedom.</p>
      
      <h3>4. Learning the Fundamentals</h3>
      <p>If you're new to React, starting with plain React can help you understand the core concepts before adding the complexity of a framework like Next.js.</p>
      
      <h2>When to Choose Next.js</h2>
      <p>Next.js might be the better choice in the following scenarios:</p>
      
      <h3>1. SEO-Critical Applications</h3>
      <p>If SEO is important for your application (e.g., e-commerce sites, blogs, marketing sites), Next.js's server-side rendering and static generation capabilities will ensure that search engines can properly index your content.</p>
      
      <h3>2. Content-Heavy Websites</h3>
      <p>For websites with a lot of content, Next.js's static generation can pre-render pages at build time, resulting in faster page loads and better user experience.</p>
      
      <h3>3. Large-Scale Applications</h3>
      <p>Next.js provides a structured approach to building applications, with built-in solutions for common requirements like routing, API routes, and image optimization. This structure can be beneficial for larger teams and more complex applications.</p>
      
      <h3>4. Performance-Critical Applications</h3>
      <p>Next.js includes various performance optimizations out of the box, such as automatic code splitting, server-side rendering, and static generation, making it easier to build high-performance applications.</p>
      
      <h2>Conclusion</h2>
      <p>Both React and Next.js are excellent tools for building modern web applications, but they serve different needs. React provides flexibility and is ideal for simpler SPAs or when you want complete control over your project structure. Next.js, on the other hand, offers additional features and optimizations that make it well-suited for SEO-critical, content-heavy, or large-scale applications.</p>
      
      <p>The choice between React and Next.js ultimately depends on your specific project requirements, team expertise, and development priorities. In many cases, starting with Next.js can be a safe choice, as it allows you to use all of React's features while providing additional capabilities that you might need as your application grows.</p>
    `},{id:"tailwind-css-tips",title:"Advanced Tailwind CSS Tips and Tricks",excerpt:"Discover advanced techniques and best practices for using Tailwind CSS in your projects to create beautiful, responsive designs efficiently.",coverImage:"https://images.unsplash.com/photo-1618788372246-79faff0c3742?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",date:"May 22, 2023",author:"John Doe",authorImage:"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80",readTime:"6 min read",tags:["CSS","Tailwind","Design","Frontend"],content:`
      <h2>Introduction to Advanced Tailwind CSS</h2>
      <p>Tailwind CSS has revolutionized the way developers approach styling in web applications. By providing a utility-first approach, it enables rapid UI development without leaving your HTML. While getting started with Tailwind is relatively straightforward, mastering its advanced features can significantly boost your productivity and the quality of your designs.</p>
      
      <p>In this article, we'll explore advanced Tailwind CSS techniques and best practices that can help you take your projects to the next level.</p>
      
      <h2>1. Customizing Your Tailwind Configuration</h2>
      <p>One of Tailwind's greatest strengths is its customizability. You can tailor the framework to your project's specific needs by modifying the tailwind.config.js file.</p>
      
      <h3>Extending the Default Theme</h3>
      <pre><code>
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'brand': {
          light: '#BFDBFE',
          DEFAULT: '#3B82F6',
          dark: '#1E40AF',
        },
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    }
  }
}
      </code></pre>
      
      <p>By extending the theme rather than overriding it, you maintain access to all of Tailwind's default utilities while adding your custom values.</p>
      
      <h3>Creating Custom Variants</h3>
      <p>Tailwind allows you to create custom variants for specific use cases:</p>
      
      <pre><code>
// tailwind.config.js
module.exports = {
  variants: {
    extend: {
      backgroundColor: ['active'],
      textColor: ['visited'],
    }
  }
}
      </code></pre>
      
      <h2>2. Leveraging @apply for Reusable Styles</h2>
      <p>While utility classes are great for one-off styling, you might find yourself repeating the same combinations of utilities across your project. This is where the @apply directive comes in handy:</p>
      
      <pre><code>
/* In your CSS file */
.btn {
  @apply py-2 px-4 font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-opacity-75;
}

.btn-primary {
  @apply bg-blue-500 text-white hover:bg-blue-700 focus:ring-blue-400;
}

.btn-secondary {
  @apply bg-gray-500 text-white hover:bg-gray-700 focus:ring-gray-400;
}
      </code></pre>
      
      <p>This approach allows you to create reusable component classes while still leveraging Tailwind's utility-first philosophy.</p>
      
      <h2>3. Responsive Design Techniques</h2>
      <p>Tailwind makes responsive design straightforward with its built-in breakpoint prefixes (sm:, md:, lg:, xl:, 2xl:). Here are some advanced techniques:</p>
      
      <h3>Mobile-First Approach</h3>
      <p>Tailwind follows a mobile-first approach, where unprefixed utilities apply to all screen sizes, and prefixed utilities apply at the specified breakpoint and above:</p>
      
      <pre><code>
<div class="text-sm md:text-base lg:text-lg">
  This text is small on mobile, medium on tablets, and large on desktops.
</div>
      </code></pre>
      
      <h3>Customizing Breakpoints</h3>
      <p>You can customize the default breakpoints or add new ones in your configuration:</p>
      
      <pre><code>
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      'portrait': {'raw': '(orientation: portrait)'},
      'landscape': {'raw': '(orientation: landscape)'},
    }
  }
}
      </code></pre>
      
      <h2>4. Using JIT Mode for Development</h2>
      <p>Tailwind's Just-in-Time (JIT) mode generates your CSS on-demand as you write your HTML, resulting in faster build times and smaller file sizes during development:</p>
      
      <pre><code>
// tailwind.config.js
module.exports = {
  mode: 'jit',
  // ...rest of your config
}
      </code></pre>
      
      <p>JIT mode also enables additional features like arbitrary value support:</p>
      
      <pre><code>
<div class="top-[117px]">
  This element has a specific top position.
</div>

<div class="grid grid-cols-[1fr,500px,2fr]">
  This grid has a custom column layout.
</div>
      </code></pre>
      
      <h2>5. Optimizing for Production</h2>
      <p>When preparing your Tailwind CSS for production, consider these optimizations:</p>
      
      <h3>Purging Unused CSS</h3>
      <p>Configure PurgeCSS to remove unused styles from your production build:</p>
      
      <pre><code>
// tailwind.config.js
module.exports = {
  purge: {
    content: [
      './pages/**/*.{js,ts,jsx,tsx}',
      './components/**/*.{js,ts,jsx,tsx}',
    ],
    // These options are passed through to PurgeCSS
    options: {
      safelist: ['bg-red-500', 'px-4'],
    },
  },
  // ...rest of your config
}
      </code></pre>
      
      <h3>Minifying Your CSS</h3>
      <p>Use a CSS minifier like cssnano in your PostCSS configuration:</p>
      
      <pre><code>
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  }
}
      </code></pre>
      
      <h2>Conclusion</h2>
      <p>Tailwind CSS offers a powerful and flexible approach to styling web applications. By mastering these advanced techniques and best practices, you can create beautiful, responsive designs more efficiently while maintaining a clean and maintainable codebase.</p>
      
      <p>Remember that the key to effective Tailwind usage is finding the right balance between utility classes and abstraction. Use @apply for commonly repeated patterns, customize your configuration to match your design system, and leverage the responsive features to create truly adaptive interfaces.</p>
      
      <p>With these tips in your toolkit, you'll be well-equipped to tackle even the most complex design challenges with Tailwind CSS.</p>
    `}];function BlogPostPage({params:e}){let t=p.find(t=>t.id===e.id);return t||(0,a.notFound)(),(0,s.jsxs)(s.Fragment,{children:[s.jsx(r.Z,{id:"blog-hero",bgColor:"bg-neutral-light",children:(0,s.jsxs)("div",{className:"max-w-4xl mx-auto",children:[s.jsx("div",{className:"mb-2",children:(0,s.jsxs)(d(),{href:"/blog",className:"inline-flex items-center text-primary hover:underline",children:[s.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-4 w-4 mr-1",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor",children:s.jsx("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M15 19l-7-7 7-7"})}),"Back to Blog"]})}),s.jsx("h1",{className:"text-3xl md:text-4xl lg:text-5xl font-bold font-heading text-neutral-darker mb-6",children:t.title}),(0,s.jsxs)("div",{className:"flex items-center mb-6",children:[s.jsx("div",{className:"relative w-10 h-10 rounded-full overflow-hidden mr-4",children:s.jsx(l(),{src:t.authorImage,alt:t.author,fill:!0,className:"object-cover"})}),(0,s.jsxs)("div",{children:[s.jsx("p",{className:"font-medium",children:t.author}),(0,s.jsxs)("div",{className:"flex items-center text-sm text-neutral-medium",children:[s.jsx("span",{children:t.date}),s.jsx("span",{className:"mx-2",children:"•"}),s.jsx("span",{children:t.readTime})]})]})]})]})}),s.jsx("div",{className:"relative h-80 md:h-96 lg:h-[500px] w-full",children:s.jsx(l(),{src:t.coverImage,alt:t.title,fill:!0,className:"object-cover",priority:!0})}),s.jsx(r.Z,{id:"blog-content",children:(0,s.jsxs)("div",{className:"grid grid-cols-1 lg:grid-cols-4 gap-12",children:[(0,s.jsxs)("div",{className:"lg:col-span-3",children:[s.jsx("article",{className:"prose prose-lg max-w-none",children:s.jsx("div",{dangerouslySetInnerHTML:{__html:t.content}})}),(0,s.jsxs)("div",{className:"mt-12 pt-6 border-t border-neutral-light",children:[s.jsx("h3",{className:"text-sm uppercase tracking-wider text-neutral-medium mb-3",children:"Tags"}),s.jsx("div",{className:"flex flex-wrap gap-2",children:t.tags.map(e=>s.jsx(d(),{href:`/blog?tag=${e}`,className:"px-4 py-2 bg-neutral-light text-neutral-dark hover:bg-neutral-medium/20 text-sm rounded-full transition-colors",children:e},e))})]})]}),s.jsx("div",{className:"lg:col-span-1",children:(0,s.jsxs)("div",{className:"sticky top-24",children:[(0,s.jsxs)("div",{className:"bg-neutral-light rounded-lg p-6",children:[s.jsx("h3",{className:"text-xl font-semibold font-heading text-neutral-darker mb-4",children:"Table of Contents"}),s.jsx("nav",{className:"toc",children:(0,s.jsxs)("ul",{className:"space-y-2 text-neutral-dark",children:[s.jsx("li",{children:s.jsx("a",{href:"#introduction",className:"hover:text-primary transition-colors",children:"Introduction"})}),s.jsx("li",{children:s.jsx("a",{href:"#section-1",className:"hover:text-primary transition-colors",children:"Section 1"})}),s.jsx("li",{children:s.jsx("a",{href:"#section-2",className:"hover:text-primary transition-colors",children:"Section 2"})}),s.jsx("li",{children:s.jsx("a",{href:"#conclusion",className:"hover:text-primary transition-colors",children:"Conclusion"})})]})})]}),(0,s.jsxs)("div",{className:"mt-8 bg-neutral-light rounded-lg p-6",children:[s.jsx("h3",{className:"text-xl font-semibold font-heading text-neutral-darker mb-4",children:"Share"}),(0,s.jsxs)("div",{className:"flex space-x-4",children:[s.jsx("a",{href:"#",className:"text-neutral-medium hover:text-primary transition-colors",children:s.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-6 w-6",fill:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{d:"M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"})})}),s.jsx("a",{href:"#",className:"text-neutral-medium hover:text-primary transition-colors",children:s.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-6 w-6",fill:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{d:"M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"})})}),s.jsx("a",{href:"#",className:"text-neutral-medium hover:text-primary transition-colors",children:s.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",className:"h-6 w-6",fill:"currentColor",viewBox:"0 0 24 24",children:s.jsx("path",{d:"M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm3.445 17.827c-3.684 1.684-9.401-9.43-5.8-11.308.72-.37 1.375.191 1.468.891.066.49-.315 1.025-.645 1.585-.124.211-.272.487-.132.693.28.411 1.045.681 1.208.721.997.248 2.2.163 3.36-.944.265-.253.683-.126.726.173.07.483-.309.993-.586 1.321-1.326 1.569-3.432 2.282-5.291 2.748-.572.143-1.176.285-1.59.645-.702.611-.993 1.747-.535 2.591.364.667 1.13 1.082 1.873 1.081 2.053-.001 3.853-1.844 3.736-3.891-.002-.036-.018-.075-.026-.112-.073-.297.058-.72.41-.597 1.202.42 1.517 2.049 1.596 2.478.042.225.062.442.062.655.001 1.888-1.752 2.604-3.062 2.604-.369 0-.719-.035-1.056-.102-.673-.135-1.012-.386-1.072-.408-.546-.198-.821-.35-.821-.35s-.409.46-.709.801c-.575.646-1.172 1.218-1.806 1.752l-.255.242.493.07c.396.056.804.091 1.218.091 4.689 0 8.5-3.81 8.5-8.5 0-4.689-3.811-8.5-8.5-8.5-4.689 0-8.5 3.811-8.5 8.5 0 4.69 3.811 8.5 8.5 8.5.406 0 .804-.029 1.193-.086l.203-.03-.054-.244c-.121-.542-.225-1.092-.3-1.647l-.034-.25-.219.218c-.327.326-.7.618-1.077.874l.105.175c-.29.034-.581.054-.879.054-4.141 0-7.5-3.358-7.5-7.5 0-4.142 3.359-7.5 7.5-7.5 4.142 0 7.5 3.358 7.5 7.5 0 .371-.027.736-.08 1.093l-.031.213.195-.087c.329-.147.659-.282.986-.414l.269-.108-.038-.277c-.054-.405-.082-.812-.082-1.22 0-4.689-3.811-8.5-8.5-8.5z"})})})]})]})]})})]})}),(0,s.jsxs)(r.Z,{id:"related-posts",bgColor:"bg-neutral-light",children:[s.jsx(o.Z,{title:"You Might Also Like",subtitle:"Explore more articles on similar topics."}),s.jsx("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-8",children:p.filter(e=>e.id!==t.id).filter(e=>e.tags.some(e=>t.tags.includes(e))).slice(0,3).map(e=>s.jsx(d(),{href:`/blog/${e.id}`,className:"group block",children:(0,s.jsxs)("div",{className:"bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow",children:[s.jsx("div",{className:"relative h-48",children:s.jsx(l(),{src:e.coverImage,alt:e.title,fill:!0,className:"object-cover transition-transform duration-300 group-hover:scale-105"})}),(0,s.jsxs)("div",{className:"p-6",children:[s.jsx("h3",{className:"text-xl font-semibold font-heading text-neutral-darker mb-2 group-hover:text-primary transition-colors",children:e.title}),(0,s.jsxs)("div",{className:"flex items-center text-sm text-neutral-medium mb-2",children:[s.jsx("span",{children:e.date}),s.jsx("span",{className:"mx-2",children:"•"}),s.jsx("span",{children:e.readTime})]})]})]})},e.id))})]})]})}},850:(e,t,i)=>{"use strict";i.r(t),i.d(t,{$$typeof:()=>o,__esModule:()=>r,default:()=>l});var s=i(5153);let a=(0,s.createProxy)(String.raw`D:\WorkProjects\Cursor\TestSite\src\app\blog\[id]\page.tsx`),{__esModule:r,$$typeof:o}=a,n=a.default,l=n}};var t=require("../../../webpack-runtime.js");t.C(e);var __webpack_exec__=e=>t(t.s=e),i=t.X(0,[897,451,258,876],()=>__webpack_exec__(7835));module.exports=i})();