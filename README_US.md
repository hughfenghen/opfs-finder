# opfs-finder

[中文](./README.md) | English

Implement MacOS Finder in the browser using AI + OPFS, and maybe try to simulate an operating system in the browser in the future.

![preview img](./preview.png)

Try it now <https://hughfenghen.github.io/opfs-finder>

## Author's Notes

When developing the [WebAV][1] project (for processing audio and video in the browser), handling large audio and video files must rely on the file system, and cannot load all data into memory like a regular Web App;  
To facilitate WebAV in processing audio and video, I encapsulated and open-sourced the [opfs-tools][2] project for convenient file operations.

[OPFS][4] is equivalent to the browser providing a private storage space for each website. Web developers can use this API to create, read, and write files in the private space without user authorization and with better performance;  
It is currently well supported in various browsers, and for more details, you can read the [Introduction to Web File System (OPFS and Tools)][3].

I am very pleased that the Web has opened up a file API that is very close to the operating system, and I predict that the OPFS API will have great application potential in the future;  
I plan to create a "product" that showcases the capabilities of OPFS to accelerate the adoption of this technology, and at the same time, use this project to improve the API of opfs-tools.

I happened to think of imitating the Finder (MacOS system file manager) APP that I use every day, so even without a visual designer, I can achieve a good visual effect;  
As Web applications become more complex and increasingly rely on the file system (OPFS), this project may become a file manager for third-party websites;  
Or implement functions such as opening/previewing text, audio, and video files, simulating a real operating system in the browser;  
As for what it is useful for now? Who knows, who can imagine what strange files you would put in a web page [doge]? (The files in this project are managed by the browser, cannot be found in the user's file system, and will not be uploaded)

At first, I was a bit hesitant about starting this project because the main work of this project is to implement "boring" page interaction logic;  
Thinking about the increasingly popular AI-assisted programming, I just needed to try its quality, and the result was quite amazing, **95% of the code in this project was implemented by AI**;  
So I put the important prompts at the startup stage of the project in the [Prompts document](./prompts.md), which can be used as a reference for beginners in AI-assisted programming;  
For those interested in this project or AI-assisted programming, you can use the TODO List as practice questions, and are encouraged to use AI to implement the functions, test them, and submit PRs.

### Summary

- [OPFS][4] is a file system API in the browser, high performance and no user authorization required
- [opfs-tools][2] is an open-source project based on OPFS, providing very convenient file operation APIs
- opfs-finder (this project) imitates the Finder App and runs in the browser
- Motivation for this project
  - To showcase the capabilities of OPFS and accelerate the adoption of this technology
  - To improve the API of opfs-tools
  - To learn and apply AI technology to assist in implementing common and boring functions, [Prompts document](./prompts.md)
- Encourage interested students to use AI to implement the TODO List and submit PRs
- Uses of this project
  - Become a file manager for complex Web applications in the future
  - Simulate an operating system in the browser (e.g., document editor, image viewer, pure Web local video player)

## Run the project

1. Clone the project to your local machine
2. Run `pnpm i`
3. Run `pnpm dev`

## TODO List

### Style

- [ ] Remove trailing zeros from file sizes
- [ ] Hide files starting with .
- [ ] Set a minimum width for the window to avoid wrapping of the file list

### Features

- [ ] Add color labels to folders
- [ ] Drag and drop files across windows
- [ ] Monitor folder changes and dynamically update the list
- [ ] Mount system file directories
- [ ] Folder list sorting method
- [ ] Publish to NPM for third-party use
- [ ] Open text files, images, audio, and video files

## Appendix

- [WebAV][1] Create/edit audio and video files in the browser
- [opfs-tools][2] Convenient, high-performance API for operating OPFS files
- [Introduction to Web File System (OPFS and Tools)][3]
- [OPFS (Origin private file system)][4] MDN documentation

[1]: https://github.com/bilibili/WebAV
[2]: https://github.com/hughfenghen/opfs-tools
[3]: https://hughfenghen.github.io/posts/2024/03/14/web-storage-and-opfs/
[4]: https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system
