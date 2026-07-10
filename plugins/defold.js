/**
 * @name Defold Engine Support
 * @description Adds support for Defold project integration, including reading atlas files.
 * @version 1.0.0
 * @author Alexander Bulatov
 * @fields atlas
 */
const e = React.createElement;

function parseAtlas(content) {
  const items = [];
  const lines = content.split('\n');
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.startsWith("images {")) {
      let imagePath = "";
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("}")) {
        const subLine = lines[i].trim();
        const imgMatch = subLine.match(/image:\s*"([^"]+)"/);
        if (imgMatch) {
          imagePath = imgMatch[1];
        }
        i++;
      }
      if (imagePath) {
        const filename = imagePath.split('/').pop();
        const name = filename.split('.')[0];
        items.push({
          name: name,
          type: 'image',
          fullPath: imagePath,
          frames: [imagePath]
        });
      }
    } else if (line.startsWith("animations {")) {
      let animId = "";
      const frames = [];
      i++;
      let braceCount = 1;
      while (i < lines.length && braceCount > 0) {
        const subLine = lines[i].trim();
        if (subLine.includes("{")) braceCount++;
        if (subLine.startsWith("}")) braceCount--;
        
        if (braceCount > 0) {
          const idMatch = subLine.match(/id:\s*"([^"]+)"/);
          if (idMatch) {
            animId = idMatch[1];
          }
          const imgMatch = subLine.match(/image:\s*"([^"]+)"/);
          if (imgMatch) {
            frames.push(imgMatch[1]);
          }
        }
        i++;
      }
      if (animId && frames.length > 0) {
        items.push({
          name: animId,
          type: 'animation',
          fullPath: frames[0], // First frame as preview
          frames: frames
        });
      }
    } else {
      i++;
    }
  }
  return items;
}

// 1. Register Setting
DataForge.registerSetting("defold", {
  id: "defoldFolderPath",
  name: "Defold project folder",
  description: "Specify the root folder of the Defold project to work with atlases.",
  type: "directory",
  default: ""
});

// 2. Register Field Type
DataForge.registerFieldType("defold", {
  id: "atlas",
  name: "Defold Atlas Image",
  icon: "boxes",
  
  renderConfig: function(props) {
    return e('div', { style: { display: 'flex', gap: '5px', alignItems: 'center', marginTop: '10px' } },
       e('input', {
         type: 'text',
         value: props.config?.atlasPath || "",
         readOnly: true,
         placeholder: "Select .atlas file",
         style: { flex: 1, padding: "6px", background: "var(--bg-input)", color: "var(--text-main)", border: "1px solid #555", borderRadius: "4px" }
       }),
       e('button', {
         onClick: async () => {
           const selected = await DataForge.Tauri.open({ multiple: false, filters: [{ name: 'Atlas', extensions: ['atlas'] }] });
           if (selected && typeof selected === 'string') {
             props.onChange({ ...props.config, atlasPath: selected });
           }
         },
         style: { padding: "6px 10px", background: "var(--bg-secondary)", color: "var(--text-main)", border: "1px solid #555", borderRadius: "4px", cursor: "pointer" }
       }, "Select Atlas")
    );
  },

  renderPreview: function(props) {
    const { atlasPath } = props.field.config || {};
    const { defoldFolderPath } = props.projectSettings || {};
    const [imageUrl, setImageUrl] = React.useState(null);

    React.useEffect(() => {
      async function loadAtlas() {
        if (!atlasPath || !props.value) return;
        try {
          let finalPath = atlasPath;
          if (defoldFolderPath && atlasPath.startsWith(defoldFolderPath)) {
             finalPath = atlasPath;
          } else if (defoldFolderPath) {
             const cleanAtlasPath = atlasPath.startsWith("/") ? atlasPath.substring(1) : atlasPath;
             const cleanDefoldPath = defoldFolderPath.endsWith("/") ? defoldFolderPath : defoldFolderPath + "/";
             finalPath = cleanDefoldPath + cleanAtlasPath;
          }
          const content = await DataForge.Tauri.readTextFile(finalPath);
          const options = parseAtlas(content);
          const selectedOption = options.find(o => o.name === props.value);
          if (selectedOption && defoldFolderPath) {
             setImageUrl(DataForge.Tauri.convertFileSrc(defoldFolderPath + (defoldFolderPath.endsWith("/") || selectedOption.fullPath.startsWith("/") ? "" : "/") + selectedOption.fullPath));
          }
        } catch (err) {
          console.error("Failed to load atlas image preview", err);
        }
      }
      loadAtlas();
    }, [atlasPath, defoldFolderPath, props.value]);

    if (!imageUrl) {
        return e('div', { style: { height: "140px", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--border-strong)", fontSize: "40px" } }, "🖼️");
    }
    return e('div', { style: { height: "140px", background: "var(--bg-input)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" } },
       e('img', { src: imageUrl, style: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" } })
    );
  },

  renderCell: function(props) {
    const { atlasPath } = props.field.config || {};
    const { defoldFolderPath } = props.projectSettings || {};
    const [options, setOptions] = React.useState([]);
    const [showMenu, setShowMenu] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    
    React.useEffect(() => {
      async function loadAtlas() {
        if (!atlasPath) return;
        try {
          let finalPath = atlasPath;
          if (defoldFolderPath && atlasPath.startsWith(defoldFolderPath)) {
             finalPath = atlasPath;
          } else if (defoldFolderPath) {
             const cleanAtlasPath = atlasPath.startsWith("/") ? atlasPath.substring(1) : atlasPath;
             const cleanDefoldPath = defoldFolderPath.endsWith("/") ? defoldFolderPath : defoldFolderPath + "/";
             finalPath = cleanDefoldPath + cleanAtlasPath;
          }
          const content = await DataForge.Tauri.readTextFile(finalPath);
          setOptions(parseAtlas(content));
        } catch (err) {
          console.error("Failed to load atlas", err);
        }
      }
      loadAtlas();
    }, [atlasPath, defoldFolderPath]);

    const selectedOption = options.find(o => o.name === props.value);
    const imageUrl = selectedOption && defoldFolderPath 
      ? DataForge.Tauri.convertFileSrc(defoldFolderPath + (defoldFolderPath.endsWith("/") || selectedOption.fullPath.startsWith("/") ? "" : "/") + selectedOption.fullPath) 
      : null;

    const filteredOptions = options.filter(o => o.name.toLowerCase().includes(searchQuery.toLowerCase()));

    return e('div', { style: { display: "flex", flexDirection: "column", gap: "10px", width: "100%", position: "relative" } },
       imageUrl ? 
         e('div', {
           onClick: () => { setSearchQuery(""); setShowMenu(true); },
           style: { width: "100%", background: "var(--bg-input)", borderRadius: "8px", border: "1px solid #333", padding: "10px", minHeight: "150px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", cursor: "pointer", gap: "8px" }
         }, 
           e('img', { src: imageUrl, style: { maxWidth: "100%", maxHeight: "120px", objectFit: "contain", borderRadius: "4px" } }),
           e('span', { style: { fontSize: "12px", color: "var(--text-secondary)", fontWeight: "bold", wordBreak: "break-all", textAlign: "center" } }, props.value)
         )
       :
         e('div', { 
           onClick: () => { setSearchQuery(""); setShowMenu(true); },
           style: { width: "100%", height: "150px", background: "var(--bg-empty)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-disabled)", borderRadius: "8px", border: "1px dashed #444", cursor: "pointer" } 
         },
           e('span', { style: { fontSize: "14px" } }, "No image"),
           e('span', { style: { fontSize: "12px", marginTop: "4px" } }, "Click to select from atlas")
         ),
         
       showMenu && e(React.Fragment, null,
         e('div', { 
           onClick: (e) => { e.stopPropagation(); setShowMenu(false); }, 
           style: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.75)", zIndex: 99999, display: "flex", justifyContent: "center", alignItems: "center" } 
         },
           e('div', {
             onClick: (e) => e.stopPropagation(),
             style: { background: "var(--bg-main, #1c1c1e)", border: "1px solid #333", borderRadius: "10px", width: "550px", maxHeight: "80vh", padding: "20px", display: "flex", flexDirection: "column", gap: "15px", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }
           },
             e('div', { style: { display: "flex", justifyContent: "space-between", alignItems: "center" } },
               e('h3', { style: { margin: 0, fontSize: "16px", color: "var(--text-main, #fff)" } }, "Select Image from Atlas"),
               e('button', { 
                 onClick: () => setShowMenu(false), 
                 style: { background: "transparent", border: "none", color: "var(--text-muted, #8e8e93)", cursor: "pointer", fontSize: "18px" } 
               }, "✕")
             ),
             
             e('div', { style: { display: "flex", gap: "10px" } },
               e('input', {
                 type: 'text',
                 placeholder: 'Search image or animation name...',
                 value: searchQuery,
                 onChange: (e) => setSearchQuery(e.target.value),
                 autoFocus: true,
                 style: { flex: 1, padding: "8px 12px", background: "var(--bg-input, #2c2c2e)", color: "var(--text-main, #fff)", border: "1px solid #3d3d41", borderRadius: "6px", fontSize: "14px" }
               }),
               props.value && e('button', {
                 onClick: () => { props.onChange(""); setShowMenu(false); },
                 style: { padding: "8px 14px", background: "var(--color-danger, #ff453a)", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }
               }, "Clear")
             ),
             
             e('div', { style: { flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px", minHeight: "150px", maxHeight: "50vh", paddingRight: "4px" } },
               filteredOptions.length === 0 && e('div', { style: { gridColumn: "1/-1", display: "flex", justifyContent: "center", alignItems: "center", height: "150px", color: "var(--text-disabled, #8e8e93)", fontSize: "14px", fontStyle: "italic" } }, "No matching images found"),
               ...filteredOptions.map(o => {
                  const url = defoldFolderPath ? DataForge.Tauri.convertFileSrc(defoldFolderPath + (defoldFolderPath.endsWith("/") || o.fullPath.startsWith("/") ? "" : "/") + o.fullPath) : null;
                  const isSelected = props.value === o.name;
                  return e('div', {
                    key: o.name,
                    onClick: () => { props.onChange(o.name); setShowMenu(false); },
                    style: {
                      display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "8px",
                      background: isSelected ? "rgba(10, 132, 255, 0.15)" : "var(--bg-item, #2c2c2e)",
                      border: isSelected ? "1px solid var(--color-accent, #0a84ff)" : "1px solid #3d3d41",
                      borderRadius: "6px", cursor: "pointer", transition: "all 0.15s ease-in-out",
                      position: "relative"
                    }
                  },
                    o.type === 'animation' && e('span', {
                      style: {
                        position: "absolute", top: "4px", right: "4px",
                        background: "rgba(10, 132, 255, 0.8)", color: "#fff",
                        fontSize: "9px", padding: "2px 5px", borderRadius: "3px",
                        fontWeight: "bold", textTransform: "uppercase", zIndex: 2
                      }
                    }, "anim"),
                    e('div', { style: { width: "100%", height: "80px", display: "flex", justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.2)", borderRadius: "4px", overflow: "hidden" } },
                      url ? e('img', { src: url, style: { maxWidth: "100%", maxHeight: "100%", objectFit: "contain" } }) : "🖼️"
                    ),
                    e('span', { style: { fontSize: "11px", color: isSelected ? "var(--color-accent, #0a84ff)" : "var(--text-secondary, #ebebf5)", wordBreak: "break-all", textAlign: "center", fontWeight: isSelected ? "bold" : "normal" } }, o.name)
                  );
               })
             )
           )
         )
       )
    );
  }
});
