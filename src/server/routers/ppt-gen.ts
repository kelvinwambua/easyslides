import { z } from "zod"
import { j, publicProcedure } from "../jstack"
import { GoogleGenerativeAI } from "@google/generative-ai"
import PptxGenJS from "pptxgenjs"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

function extractJsonFromText(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
    const match = text.match(jsonRegex);
    
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]);
      } catch (innerError) {}
    }
    
    const jsonObjectRegex = /(\{[\s\S]*\})/g;
    const possibleJsons = text.match(jsonObjectRegex);
    
    if (possibleJsons) {
      for (const jsonStr of possibleJsons) {
        try {
          const cleaned = jsonStr
            .replace(/\\n/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":');
          
          return JSON.parse(cleaned);
        } catch (err) {}
      }
    }
    
    return generateFallbackPresentation(text);
  }
}

function generateFallbackPresentation(aiResponse) {
  let title = "Presentation";
  const titleMatch = aiResponse.match(/["']title["']\s*:\s*["']([^"']+)["']/);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1];
  }
  
  const colors = {
    primary: "4472C4",
    secondary: "5B9BD5",
    accent: "ED7D31",
    background: "FFFFFF",
    text: "333333"
  };
  
  const hexColorRegex = /#([0-9A-Fa-f]{6})/g;
  const hexColors = [...aiResponse.matchAll(hexColorRegex)];
  if (hexColors.length >= 3) {
    colors.primary = hexColors[0][1];
    colors.secondary = hexColors[1][1];
    colors.accent = hexColors[2][1];
  }
  
  const slideTitles = [];
  const titleRegex = /["']title["']\s*:\s*["']([^"']+)["']/g;
  let match;
  while ((match = titleRegex.exec(aiResponse)) !== null) {
    slideTitles.push(match[1]);
  }
  
  const defaultTitles = [
    "Introduction", "Key Points", "Details", "Analysis", "Conclusion"
  ];
  
  while (slideTitles.length < 5) {
    slideTitles.push(defaultTitles[slideTitles.length]);
  }
  
  const contentItems = [];
  const bulletRegex = /["']content["'][^[]*\[([\s\S]*?)\]/g;
  const bulletMatches = [...aiResponse.matchAll(bulletRegex)];
  
  if (bulletMatches.length > 0) {
    for (const match of bulletMatches) {
      const contentText = match[1];
      const items = contentText.split(/["'],\s*["']/).map(item => 
        item.replace(/^["']|["']$/g, '')
      );
      contentItems.push(...items.filter(item => item.length > 0));
    }
  }
  
  const defaultPoints = [
    "First important point to consider",
    "Analysis of key factors",
    "Strategic considerations",
    "Implementation approach",
    "Expected outcomes and results",
    "Next steps forward"
  ];
  
  while (contentItems.length < 12) {
    contentItems.push(defaultPoints[contentItems.length % defaultPoints.length]);
  }
  
  return {
    title: title,
    theme: {
      colorScheme: colors,
      fonts: {
        title: "Segoe UI",
        body: "Calibri"
      },
      visualStyle: "Modern and impactful",
      layoutPrinciple: "Strong visual focus with dynamic elements",
      backgroundStyle: "Gradient with subtle patterns"
    },
    slides: slideTitles.map((title, index) => {
      const slideType = index === 0 ? "title" : 
                      index === slideTitles.length - 1 ? "conclusion" : 
                      index % 3 === 0 ? "chart" :
                      index % 2 === 0 ? "comparison" : "content";
      
      return {
        id: `slide-${index + 1}`,
        slideType: slideType,
        title: title,
        description: `Slide about ${title.toLowerCase()}`,
        layout: {
          titlePosition: {
            x: 0.8,
            y: 0.5,
            width: 8.4,
            height: 1.2,
            align: "left"
          },
          contentPosition: {
            x: 0.8,
            y: 2.0,
            width: 8.4,
            height: 4.0
          },
          titleStyle: {
            fontSize: 38,
            bold: true
          },
          contentStyle: {
            fontSize: 24,
            bullet: true,
            lineSpacing: 1.5
          }
        },
        content: [
          contentItems[index * 2],
          contentItems[index * 2 + 1],
          index < contentItems.length / 2 ? contentItems[index * 2 + 2] : "Additional considerations"
        ],
        visualElements: slideType === "title" ? [
          {
            type: "shape",
            shape: "rect",
            position: {
              x: 0,
              y: 0,
              width: 3,
              height: 5.63
            },
            color: colors.primary,
            opacity: 0.8
          },
          {
            type: "shape",
            shape: "rect",
            position: {
              x: 0,
              y: 5.63,
              width: 10,
              height: 0.7
            },
            color: colors.accent,
            opacity: 0.9
          }
        ] : slideType === "chart" ? [
          {
            type: "shape",
            shape: "rect",
            position: {
              x: 0,
              y: 0,
              width: 0.4,
              height: 6.33
            },
            color: colors.primary,
            opacity: 0.8
          },
          {
            type: "chart",
            chartType: "bar",
            position: {
              x: 5.5,
              y: 2.2,
              width: 4.0,
              height: 3.5
            },
            title: "Data Analysis",
            data: {
              labels: ["Category A", "Category B", "Category C", "Category D"],
              values: [4.3, 2.5, 3.5, 4.5]
            },
            showTitle: false,
            showLegend: true,
            color: colors.primary
          }
        ] : slideType === "comparison" ? [
          {
            type: "shape",
            shape: "rect",
            position: {
              x: 0,
              y: 0,
              width: 0.4,
              height: 6.33
            },
            color: colors.accent,
            opacity: 0.8
          },
          {
            type: "shape",
            shape: "rect", 
            position: {
              x: 5.5,
              y: 2.5,
              width: 4.0,
              height: 2.5
            },
            color: colors.secondary + "22",
            outline: {
              color: colors.secondary,
              width: 2
            }
          },
          {
            type: "text",
            text: "Option A",
            position: {
              x: 5.5,
              y: 2.0, 
              width: 4.0,
              height: 0.5
            },
            color: colors.secondary,
            fontSize: 22,
            bold: true,
            align: "left"
          }
        ] : slideType === "conclusion" ? [
          {
            type: "shape",
            shape: "rect",
            position: {
              x: 0,
              y: 0,
              width: 0.4,
              height: 6.33
            },
            color: colors.accent,
            opacity: 0.8
          },
          {
            type: "shape",
            shape: "rect",
            position: {
              x: 0,
              y: 5.63,
              width: 10,
              height: 0.7
            },
            color: colors.secondary,
            opacity: 0.7
          }
        ] : [
          {
            type: "shape",
            shape: "rect",
            position: {
              x: 0,
              y: 0,
              width: 0.4,
              height: 6.33
            },
            color: colors.secondary,
            opacity: 0.8
          }
        ],
        speakerNotes: `Speaker notes for the ${title.toLowerCase()} slide`
      };
    })
  };
}

export const slidesRouter = j.router({
  generateFromPrompt: publicProcedure
    .input(z.object({ 
      prompt: z.string().min(1),
      slideCount: z.number().optional().default(5),
      author: z.string().optional(),
      company: z.string().optional(),
      contactEmail: z.string().optional(),
      layout: z.string().optional(),
      theme: z.string().optional(),
      includeCharts: z.boolean().optional().default(true),
      includeImages: z.boolean().optional().default(true),
      sections: z.array(z.string()).optional()
    }))
    .mutation(async ({ c, input }) => {
      const { prompt, slideCount, author, company, contactEmail, layout, theme, includeCharts, includeImages, sections } = input;
      
      try {
        let presentationDesign;
        let usedFallback = false;
        
        try {
          const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
          
          const geminiPrompt = `Create a visually stunning professional presentation about "${prompt}" with ${slideCount} slides.

          Your design should follow modern presentation design principles with clear visual hierarchy, effective use of space, and professional typography.

          Return your design as VALID JSON with this structure:
          {
            "title": "Overall Presentation Title",
            "theme": {
              "colorScheme": {
                "primary": "#hexcode",
                "secondary": "#hexcode",
                "accent": "#hexcode",
                "background": "#hexcode",
                "text": "#hexcode"
              },
              "fonts": {
                "title": "Font name",
                "body": "Font name"
              },
              "visualStyle": "Description",
              "layoutPrinciple": "Description",
              "backgroundStyle": "Description"
            },
            "sections": [
              {
                "title": "Section Title",
                "order": 1
              }
            ],
            "slides": [
              {
                "id": "slide-1",
                "sectionTitle": "Section Title",  
                "slideType": "title",
                "title": "Slide Title",
                "description": "What this slide conveys",
                "layout": {
                  "titlePosition": {
                    "x": 0.8,
                    "y": 0.5,
                    "width": 8.4,
                    "height": 1.2,
                    "align": "left"
                  },
                  "contentPosition": {
                    "x": 0.8,
                    "y": 2.0,
                    "width": 8.4,
                    "height": 4.0
                  },
                  "titleStyle": {
                    "fontSize": 38,
                    "bold": true
                  },
                  "contentStyle": {
                    "fontSize": 24,
                    "bullet": true,
                    "lineSpacing": 1.5
                  }
                },
                "content": [
                  "First bullet point (make these compelling and insightful)",
                  "Second bullet point",
                  "Third bullet point"
                ],
                "visualElements": [
                  {
                    "type": "shape",
                    "shape": "rect",
                    "position": {
                      "x": 0,
                      "y": 0,
                      "width": 3,
                      "height": 5.63
                    },
                    "color": "#hexcode",
                    "opacity": 0.8
                  }
                ],
                "speakerNotes": "Notes for presenter",
                "tableData": {
                  "headers": ["Column 1", "Column 2", "Column 3"],
                  "rows": [
                    ["Data 1", "Data 2", "Data 3"],
                    ["Data 4", "Data 5", "Data 6"]
                  ],
                  "colW": [3, 3, 3]
                },
                "chartData": {
                  "chartType": "bar",
                  "title": "Chart Title",
                  "data": {
                    "labels": ["Category A", "Category B", "Category C", "Category D"],
                    "values": [4.3, 2.5, 3.5, 4.5]
                  },
                  "position": {
                    "x": 5.5,
                    "y": 2.2,
                    "width": 4.0,
                    "height": 3.5
                  }
                },
                "imageData": {
                  "placeholder": "Description of image to generate",
                  "position": {
                    "x": 5.5,
                    "y": 2.5,
                    "width": 4.0,
                    "height": 3.0
                  }
                }
              }
            ]
          }

          Important design requirements:
          1. Create a clean, modern design with strategic use of whitespace
          2. Use color accents and shapes to create visual interest
          3. Align content consistently - text should be left-aligned
          4. Use different slide types (title, content, chart, comparison, conclusion)
          5. Include appropriate visual elements on each slide
          6. Maintain visual consistency throughout the presentation
          7. Design for widescreen (16:9) format
          8. Font sizes should be large enough for readability (min 18pt for body text)
          9. Create meaningful sections to organize content effectively
          10. Include charts, tables and placeholder images where appropriate
          11. Use scheme colors for consistency and theme compliance
          12. Provide realistic and insightful content related to the prompt
          13. Include professional slide transitions and animations where appropriate

          Return ONLY valid JSON - no explanations or markdown formatting.`;
          
          const result = await model.generateContent(geminiPrompt);
          const response = await result.response;
          const text = response.text();
          
          presentationDesign = extractJsonFromText(text);
          
        } catch (aiError) {
          presentationDesign = {
            title: `Presentation: ${prompt}`,
            theme: {
              colorScheme: {
                primary: "4472C4",
                secondary: "5B9BD5",
                accent: "ED7D31",
                background: "FFFFFF",
                text: "333333"
              },
              fonts: {
                title: "Segoe UI",
                body: "Calibri"
              },
              visualStyle: "Modern and professional",
              layoutPrinciple: "Clear visual hierarchy with dynamic elements",
              backgroundStyle: "Clean with accent shapes"
            },
            sections: [
              { title: "Introduction", order: 1 },
              { title: "Key Points", order: 2 },
              { title: "Details", order: 3 },
              { title: "Conclusion", order: 4 }
            ],
            slides: Array.from({ length: slideCount }, (_, i) => ({
              id: `slide-${i+1}`,
              sectionTitle: i === 0 ? "Introduction" : 
                            i === slideCount-1 ? "Conclusion" : 
                            i < slideCount/2 ? "Key Points" : "Details",
              slideType: i === 0 ? "title" : 
                         i === slideCount-1 ? "conclusion" : 
                         i % 3 === 0 ? "chart" : 
                         i % 2 === 0 ? "comparison" : "content",
              title: i === 0 ? prompt : i === slideCount-1 ? "Conclusion" : `Key Point ${i}`,
              layout: {
                titlePosition: {
                  x: 0.8,
                  y: 0.5,
                  width: 8.4,
                  height: 1.2,
                  align: "left"
                },
                contentPosition: {
                  x: 0.8,
                  y: 2.0,
                  width: 8.4,
                  height: 4.0
                },
                titleStyle: {
                  fontSize: 38,
                  bold: true
                },
                contentStyle: {
                  fontSize: 24,
                  bullet: true,
                  lineSpacing: 1.5
                }
              },
              content: [
                "Key insight about this topic",
                "Important consideration for stakeholders",
                "Strategic recommendation based on analysis"
              ],
              visualElements: i === 0 ? [
                {
                  type: "shape",
                  shape: "rect",
                  position: {
                    x: 0,
                    y: 0,
                    width: 3,
                    height: 5.63
                  },
                  color: "4472C4",
                  opacity: 0.8
                },
                {
                  type: "shape",
                  shape: "rect",
                  position: {
                    x: 0,
                    y: 5.63,
                    width: 10,
                    height: 0.7
                  },
                  color: "ED7D31",
                  opacity: 0.9
                }
              ] : [
                {
                  type: "shape",
                  shape: "rect",
                  position: {
                    x: 0,
                    y: 0,
                    width: 0.4,
                    height: 6.33
                  },
                  color: i % 2 === 0 ? "4472C4" : "5B9BD5",
                  opacity: 0.8
                }
              ],
              speakerNotes: `Speaker notes for slide ${i+1}`,
              chartData: i % 3 === 0 ? {
                chartType: "bar",
                title: "Data Analysis",
                data: {
                  labels: ["Category A", "Category B", "Category C", "Category D"],
                  values: [4.3, 2.5, 3.5, 4.5]
                },
                position: {
                  x: 5.5,
                  y: 2.2,
                  width: 4.0,
                  height: 3.5
                }
              } : null,
              tableData: i % 4 === 2 ? {
                headers: ["Element", "Description", "Impact"],
                rows: [
                  ["Factor 1", "Description of factor 1", "High"],
                  ["Factor 2", "Description of factor 2", "Medium"],
                  ["Factor 3", "Description of factor 3", "Low"]
                ],
                colW: [2, 4, 2]
              } : null,
              imageData: i % 5 === 3 ? {
                placeholder: `Image related to ${prompt}`,
                position: {
                  x: 5.5,
                  y: 2.5, 
                  width: 4.0,
                  height: 3.0
                }
              } : null
            }))
          };
          usedFallback = true;
        }
        
        // Initialize PptxGenJS with the presentation template
        const pres = new PptxGenJS();
        pres.title = presentationDesign.title;
        pres.subject = `Presentation about ${prompt}`;
        pres.author = author || "Presentation Generator";
        pres.company = company || "Your Company";
        
        // Set layout
        if (layout && layout.toLowerCase() === "wide") {
          pres.layout = "LAYOUT_WIDE";
        }
        
        // Set theme if provided
        if (theme) {
          try {
            const themeData = JSON.parse(theme);
            if (themeData.colorScheme) {
              presentationDesign.theme.colorScheme = {
                ...presentationDesign.theme.colorScheme,
                ...themeData.colorScheme
              };
            }
            if (themeData.fonts) {
              presentationDesign.theme.fonts = {
                ...presentationDesign.theme.fonts,
                ...themeData.fonts
              };
            }
          } catch (e) {
            // Invalid theme JSON, use default
          }
        }
        
        const colorScheme = presentationDesign.theme?.colorScheme || {};
        
        // Define a slide master for consistent design
        pres.defineSlideMaster({
          title: "MASTER_SLIDE",
          background: { color: colorScheme.background?.replace(/^#/, '') || "FFFFFF" },
          slideNumber: { x: 0.3, y: "95%" },
          objects: [
            { 
              rect: { 
                x: 0, 
                y: 0, 
                w: 0.4, 
                h: "100%", 
                fill: { color: (colorScheme.primary || "4472C4").replace(/^#/, '') } 
              } 
            },
            { 
              rect: { 
                x: 0, 
                y: 5.63, 
                w: "100%", 
                h: 0.7, 
                fill: { color: (colorScheme.accent || "ED7D31").replace(/^#/, '') } 
              } 
            }
          ]
        });
        
        // Add sections if provided
        const designSections = presentationDesign.sections || [];
        if (sections && sections.length > 0) {
          sections.forEach((section, idx) => {
            pres.addSection({ title: section, order: idx + 1 });
          });
        } else {
          designSections.forEach(section => {
            pres.addSection({ title: section.title, order: section.order });
          });
        }
        
        // Create slides
        presentationDesign.slides.forEach((slide) => {
          // Add slide with master and section
          const newSlide = pres.addSlide({ 
            masterName: "MASTER_SLIDE",
            sectionTitle: slide.sectionTitle
          });
          
          // Background color
          if (colorScheme.background) {
            newSlide.background = { color: colorScheme.background.replace(/^#/, '') };
          }
          
          // Add visual elements
          if (slide.visualElements && Array.isArray(slide.visualElements)) {
            slide.visualElements.forEach(element => {
              if (!element.type) return;
              
              const elemX = element.position?.x || 0;
              const elemY = element.position?.y || 0;
              const elemW = element.position?.width || 1;
              const elemH = element.position?.height || 1;
              const elemColor = (element.color || colorScheme.primary || '4472C4').replace(/^#/, '');
              const elemOpacity = element.opacity !== undefined ? element.opacity : 1;
              
              if (element.type === 'shape') {
                const validShapes = ['rect', 'rectangle', 'ellipse', 'triangle', 'line', 'cloud', 'hexagon', 'cube', 'star'];
                const shapeType = validShapes.includes(element.shape?.toLowerCase()) ? 
                                element.shape : 'rect';
                
                newSlide.addShape(shapeType, {
                  x: elemX,
                  y: elemY,
                  w: elemW,
                  h: elemH,
                  fill: { color: elemColor, transparency: (1 - elemOpacity) * 100 },
                  line: element.outline ? { 
                    color: (element.outline.color || elemColor).replace(/^#/, ''),
                    width: element.outline.width || 1
                  } : null,
                  rotate: element.rotate
                });
              } else if (element.type === 'text') {
                newSlide.addText(element.text || "", {
                  x: elemX,
                  y: elemY,
                  w: elemW,
                  h: elemH,
                  color: elemColor,
                  fontSize: element.fontSize || 20,
                  bold: element.bold,
                  italic: element.italic,
                  align: element.align || 'left',
                  fontFace: element.fontFace || presentationDesign.theme?.fonts?.body || "Calibri"
                });
              } else if (element.type === 'chart' && element.data) {
                const chartLabels = element.data.labels || ['A', 'B', 'C', 'D'];
                const chartValues = element.data.values || [4.3, 2.5, 3.5, 4.5];
                
                try {
                  const chartType = (element.chartType || 'bar').toUpperCase();
                  const pptxChartType = 
                    chartType === 'BAR' ? pres.ChartType.BAR : 
                    chartType === 'LINE' ? pres.ChartType.LINE : 
                    chartType === 'PIE' ? pres.ChartType.PIE : 
                    chartType === 'AREA' ? pres.ChartType.AREA : 
                    chartType === 'DOUGHNUT' ? pres.ChartType.DOUGHNUT :
                    chartType === 'SCATTER' ? pres.ChartType.SCATTER :
                    pres.ChartType.BAR;
                  
                  newSlide.addChart(
                    pptxChartType,
                    [
                      {
                        name: element.title || 'Data',
                        labels: chartLabels,
                        values: chartValues
                      }
                    ],
                    {
                      x: elemX,
                      y: elemY,
                      w: elemW,
                      h: elemH,
                      showTitle: element.showTitle !== false,
                      title: element.title || 'Chart',
                      showLegend: element.showLegend !== false,
                      chartColors: [(element.color || colorScheme.primary || '4472C4').replace(/^#/, '')]
                    }
                  );
                } catch (chartError) {
                  newSlide.addShape('rect', {
                    x: elemX,
                    y: elemY,
                    w: elemW,
                    h: elemH,
                    fill: { color: elemColor + '33' },
                    line: { color: elemColor, width: 2 }
                  });
                  
                  newSlide.addText('Chart: ' + (element.title || 'Data Visualization'), {
                    x: elemX,
                    y: elemY + elemH/2 - 0.25,
                    w: elemW,
                    h: 0.5,
                    color: elemColor,
                    fontSize: 16,
                    align: 'center'
                  });
                }
              }
            });
          }
          
          // Add title
          if (slide.title) {
            const titleColor = colorScheme.text || '333333';
            const titleX = slide.layout?.titlePosition?.x || 0.8;
            const titleY = slide.layout?.titlePosition?.y || 0.5;
            const titleW = slide.layout?.titlePosition?.width || 8.4;
            const titleH = slide.layout?.titlePosition?.height || 1.2;
            const titleAlign = slide.layout?.titlePosition?.align || "left";
            const titleFontSize = slide.layout?.titleStyle?.fontSize || 38;
            const titleFontFace = presentationDesign.theme?.fonts?.title || "Segoe UI";
            
            newSlide.addText(slide.title, {
              x: titleX,
              y: titleY,
              w: titleW,
              h: titleH,
              fontSize: titleFontSize,
              fontFace: titleFontFace,
              color: titleColor.replace(/^#/, ''),
              align: titleAlign,
              bold: true
            });
          }
          
          // Add content bullets
          if (slide.content && Array.isArray(slide.content)) {
            const contentX = slide.layout?.contentPosition?.x || 0.8;
            const contentY = slide.layout?.contentPosition?.y || 2.0;
            const contentW = slide.layout?.contentPosition?.width || 8.4;
            const contentH = slide.layout?.contentPosition?.height || 4.0;
            const contentColor = colorScheme.text || '333333';
            const contentFontSize = slide.layout?.contentStyle?.fontSize || 24;
            const contentFontFace = presentationDesign.theme?.fonts?.body || "Calibri";
            const lineSpacing = slide.layout?.contentStyle?.lineSpacing || 1.5;
            
            const contentItems = slide.content.filter(Boolean).map(item => ({
              text: item,
              options: { 
                bullet: { type: "bullet" }, 
                color: contentColor.replace(/^#/, ''),
                breakLine: true
              }
            }));
            
            if (contentItems.length > 0) {
              newSlide.addText(contentItems, {
                x: contentX,
                y: contentY,
                w: contentW,
                h: contentH,
                fontSize: contentFontSize,
                fontFace: contentFontFace,
                lineSpacingMultiple: lineSpacing
              });
            }
          }
          
          // Add chart if available and charts are enabled
          if (includeCharts && slide.chartData) {
            const chart = slide.chartData;
            const chartX = chart.position?.x || 5.5;
            const chartY = chart.position?.y || 2.2;
            const chartW = chart.position?.width || 4.0;
            const chartH = chart.position?.height || 3.5;
            
            try {
              const chartType = (chart.chartType || 'bar').toUpperCase();
              const pptxChartType = 
                chartType === 'BAR' ? pres.ChartType.BAR : 
                chartType === 'LINE' ? pres.ChartType.LINE : 
                chartType === 'PIE' ? pres.ChartType.PIE : 
                chartType === 'AREA' ? pres.ChartType.AREA : 
               chartType === 'DOUGHNUT' ? pres.ChartType.DOUGHNUT :
               chartType === 'SCATTER' ? pres.ChartType.SCATTER :
               pres.ChartType.BAR;
             
             newSlide.addChart(
               pptxChartType,
               [
                 {
                   name: chart.title || 'Data',
                   labels: chart.data.labels || ['Category A', 'Category B', 'Category C', 'Category D'],
                   values: chart.data.values || [4.3, 2.5, 3.5, 4.5]
                 }
               ],
               {
                 x: chartX,
                 y: chartY,
                 w: chartW,
                 h: chartH,
                 showTitle: true,
                 title: chart.title || 'Data Analysis',
                 showLegend: true,
                 chartColors: [(colorScheme.primary || '4472C4').replace(/^#/, '')]
               }
             );
           } catch (chartError) {
             // Fallback for chart errors
             newSlide.addShape('rect', {
               x: chartX,
               y: chartY,
               w: chartW,
               h: chartH,
               fill: { color: (colorScheme.primary + '33').replace(/^#/, '') },
               line: { color: colorScheme.primary.replace(/^#/, ''), width: 2 }
             });
             
             newSlide.addText('Chart: ' + (chart.title || 'Data Visualization'), {
               x: chartX,
               y: chartY + chartH/2 - 0.25,
               w: chartW,
               h: 0.5,
               color: colorScheme.primary.replace(/^#/, ''),
               fontSize: 16,
               align: 'center'
             });
           }
         }
         
         // Add table if available
         if (slide.tableData) {
           const table = slide.tableData;
           const tableX = 0.8;
           const tableY = slide.content && slide.content.length > 0 ? 3.5 : 2.0;
           
           if (table.headers && table.rows) {
             const tableRows = [table.headers, ...table.rows];
             const tableOpts = {
               x: tableX,
               y: tableY,
               w: 8.4,
               colW: table.colW || Array(table.headers.length).fill(8.4 / table.headers.length),
               color: colorScheme.text.replace(/^#/, ''),
               fontSize: 14,
               fontFace: presentationDesign.theme?.fonts?.body || "Calibri",
               border: { pt: 0.5, color: colorScheme.secondary.replace(/^#/, '') }
             };
             
             // Add header styling
             const headerOpts = {
               fill: { color: colorScheme.primary.replace(/^#/, '') },
               color: "FFFFFF",
               fontSize: 16,
               bold: true
             };
             
             // Add alternating row colors
             for (let i = 0; i < tableRows.length; i++) {
               if (i === 0) {
                 // Header row
                 tableOpts[`r${i}`] = headerOpts;
               } else if (i % 2 === 1) {
                 // Odd rows
                 tableOpts[`r${i}`] = { fill: { color: "F5F5F5" } };
               } else {
                 // Even rows
                 tableOpts[`r${i}`] = { fill: { color: "FFFFFF" } };
               }
             }
             
             newSlide.addTable(tableRows, tableOpts);
           }
         }
         
         // Add image placeholders if enabled
         if (includeImages && slide.imageData) {
           const image = slide.imageData;
           const imgX = image.position?.x || 5.5;
           const imgY = image.position?.y || 2.5;
           const imgW = image.position?.width || 4.0;
           const imgH = image.position?.height || 3.0;
           
           // Create a placeholder rectangle with text
           newSlide.addShape('rect', {
             x: imgX,
             y: imgY,
             w: imgW,
             h: imgH,
             fill: { color: (colorScheme.secondary + '22').replace(/^#/, '') },
             line: { color: colorScheme.secondary.replace(/^#/, ''), width: 1 }
           });
           
           newSlide.addText('Image: ' + (image.placeholder || 'Visual Representation'), {
             x: imgX + 0.1,
             y: imgY + imgH/2 - 0.5,
             w: imgW - 0.2,
             h: 1.0,
             color: colorScheme.secondary.replace(/^#/, ''),
             fontSize: 14,
             align: 'center',
             valign: 'middle'
           });
         }
         
         // Add speaker notes
         if (slide.speakerNotes) {
           newSlide.addNotes(slide.speakerNotes);
         }
       });
       
       // Generate the presentation
       const pptxBase64 = await pres.write({ outputType: 'base64' });
       
       return c.json({
         success: true,
         message: "Custom presentation created successfully",
         data: {
           presentation: pptxBase64,
           format: "pptx",
           filename: `${prompt.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.pptx`,
           slideCount: presentationDesign.slides.length,
           theme: presentationDesign.theme,
           usedFallback
         }
       });
       
     } catch (error) {
       return c.json({
         success: false,
         message: `Failed to generate presentation: ${error.message}`,
         error: error.message
       }, 500);
     }
   }),
   
 // Create a presentation from HTML table
 generateFromTable: publicProcedure
   .input(z.object({
     tableHtml: z.string().min(1),
     title: z.string().optional(),
     author: z.string().optional(),
     company: z.string().optional()
   }))
   .mutation(async ({ c, input }) => {
     const { tableHtml, title, author, company } = input;
     
     try {
       const pres = new PptxGenJS();
       pres.title = title || "Table Presentation";
       pres.author = author || "Presentation Generator";
       pres.company = company || "Your Company";
       
       // Create a simple master slide
       pres.defineSlideMaster({
         title: "TABLE_MASTER",
         background: { color: "FFFFFF" },
         objects: [
           { rect: { x: 0, y: 0, w: "100%", h: 0.75, fill: { color: "F1F1F1" } } },
           { text: { text: title || "Data Presentation", options: { x: 0.5, y: 0.1, w: 5.5, h: 0.75, fontSize: 20, bold: true } } },
         ],
         slideNumber: { x: 0.3, y: "95%" }
       });
       
       // Create a JSDOM environment to parse HTML
       const tempDiv = document.createElement('div');
       tempDiv.innerHTML = tableHtml;
       
       const table = tempDiv.querySelector('table');
       if (!table) {
         throw new Error("No table found in provided HTML");
       }
       
       // Extract table data
       const tableData = [];
       const rows = table.querySelectorAll('tr');
       
       rows.forEach(row => {
         const rowData = [];
         const cells = row.querySelectorAll('td, th');
         
         cells.forEach(cell => {
           rowData.push(cell.textContent.trim());
         });
         
         if (rowData.length > 0) {
           tableData.push(rowData);
         }
       });
       
       // Create slide with table
       const slide = pres.addSlide({ masterName: "TABLE_MASTER" });
       
       // Add title
       slide.addText(title || "Table Data", {
         x: 0.5,
         y: 1.0,
         w: 9.0,
         h: 0.8,
         fontSize: 24,
         bold: true,
         color: "363636"
       });
       
       // Add table
       if (tableData.length > 0) {
         const colCount = Math.max(...tableData.map(row => row.length));
         const colWidth = 9.0 / colCount;
         
         // Get column widths from data-pptx-width attributes if available
         const colWidths = Array(colCount).fill(colWidth);
         const headerRow = table.querySelector('thead tr');
         
         if (headerRow) {
           const headerCells = headerRow.querySelectorAll('th');
           headerCells.forEach((cell, idx) => {
             const widthAttr = cell.getAttribute('data-pptx-width');
             if (widthAttr && !isNaN(parseFloat(widthAttr))) {
               colWidths[idx] = parseFloat(widthAttr);
             }
             
             const minWidthAttr = cell.getAttribute('data-pptx-min-width');
             if (minWidthAttr && !isNaN(parseFloat(minWidthAttr))) {
               colWidths[idx] = Math.max(colWidths[idx], parseFloat(minWidthAttr));
             }
           });
         }
         
         // Create table options
         const tableOpts = {
           x: 0.5,
           y: 2.0,
           w: 9.0,
           colW: colWidths,
           color: "333333",
           fontSize: 14,
           border: { pt: 0.5, color: "999999" }
         };
         
         // Add header styling
         if (tableData.length > 0) {
           tableOpts.r0 = {
             fill: { color: "4472C4" },
             color: "FFFFFF",
             fontSize: 16,
             bold: true
           };
         }
         
         // Add alternating row colors
         for (let i = 1; i < tableData.length; i++) {
           if (i % 2 === 0) {
             tableOpts[`r${i}`] = { fill: { color: "F5F5F5" } };
           }
         }
         
         slide.addTable(tableData, tableOpts);
       }
       
       // Create the presentation
       const pptxBase64 = await pres.write({ outputType: 'base64' });
       
       return c.json({
         success: true,
         message: "Table presentation created successfully",
         data: {
           presentation: pptxBase64,
           format: "pptx",
           filename: `${title || 'Table_Presentation'}.pptx`
         }
       });
       
     } catch (error) {
       return c.json({
         success: false,
         message: `Failed to generate table presentation: ${error.message}`,
         error: error.message
       }, 500);
     }
   }),
   
 // Generate a custom master slide template
 createMasterTemplate: publicProcedure
   .input(z.object({
     title: z.string().min(1),
     background: z.object({
       color: z.string().optional(),
       transparency: z.number().optional()
     }).optional(),
     colorScheme: z.object({
       primary: z.string().optional(),
       secondary: z.string().optional(),
       accent: z.string().optional(),
       background: z.string().optional(),
       text: z.string().optional()
     }).optional(),
     fonts: z.object({
       title: z.string().optional(),
       body: z.string().optional()
     }).optional(),
     logoPath: z.string().optional(),
     logoPosition: z.object({
       x: z.number().optional(),
       y: z.number().optional(),
       w: z.number().optional(),
       h: z.number().optional()
     }).optional(),
     footerText: z.string().optional()
   }))
   .mutation(async ({ c, input }) => {
     const { title, background, colorScheme, fonts, logoPath, logoPosition, footerText } = input;
     
     try {
       const pres = new PptxGenJS();
       
       // Default colors
       const colors = {
         primary: (colorScheme?.primary || "4472C4").replace(/^#/, ''),
         secondary: (colorScheme?.secondary || "5B9BD5").replace(/^#/, ''),
         accent: (colorScheme?.accent || "ED7D31").replace(/^#/, ''),
         background: (colorScheme?.background || "FFFFFF").replace(/^#/, ''),
         text: (colorScheme?.text || "333333").replace(/^#/, '')
       };
       
       // Create master slide objects
       const masterObjects = [
         // Header bar
         { 
           rect: { 
             x: 0, 
             y: 0, 
             w: "100%", 
             h: 0.75, 
             fill: { color: colors.primary } 
           } 
         },
         // Footer bar
         { 
           rect: { 
             x: 0, 
             y: 5.63, 
             w: "100%", 
             h: 0.7, 
             fill: { color: colors.accent } 
           } 
         }
       ];
       
       // Add footer text if provided
       if (footerText) {
         masterObjects.push({
           text: { 
             text: footerText, 
             options: { 
               x: 0.5, 
               y: 5.7, 
               w: 9.0, 
               h: 0.5, 
               color: "FFFFFF",
               fontSize: 12
             } 
           }
         });
       }
       
       // Add logo placeholder if position provided
       if (logoPosition) {
         const logoX = logoPosition.x || 9.0;
         const logoY = logoPosition.y || 0.1;
         const logoW = logoPosition.w || 1.0;
         const logoH = logoPosition.h || 0.5;
         
         masterObjects.push({
           rect: { 
             x: logoX, 
             y: logoY, 
             w: logoW, 
             h: logoH, 
             fill: { color: colors.secondary + "33" },
             line: { color: colors.secondary, width: 1 } 
           }
         });
         
         masterObjects.push({
           text: { 
             text: "LOGO", 
             options: { 
               x: logoX, 
               y: logoY, 
               w: logoW, 
               h: logoH, 
               color: colors.secondary,
               fontSize: 12,
               align: "center",
               valign: "middle"
             } 
           }
         });
       }
       
       // Create the master slide
       pres.defineSlideMaster({
         title: title,
         background: { 
           color: colors.background,
           transparency: background?.transparency
         },
         objects: masterObjects,
         slideNumber: { x: 0.3, y: "95%" }
       });
       
       // Create sample slide to demonstrate master
       const slide = pres.addSlide({ masterName: title });
       
       // Add title placeholder
       slide.addText("Slide Title", {
         placeholder: "title",
         x: 0.5,
         y: 1.0,
         w: 9.0,
         h: 0.8,
         fontSize: 32,
         bold: true,
         color: colors.text,
         fontFace: fonts?.title || "Segoe UI"
       });
       
       // Add body placeholder
       slide.addText([
         { text: "Sample Content", options: { bullet: { type: "bullet" }, color: colors.text, breakLine: true } },
         { text: "Bullet point 2", options: { bullet: { type: "bullet" }, color: colors.text, breakLine: true } },
         { text: "Bullet point 3", options: { bullet: { type: "bullet" }, color: colors.text, breakLine: true } }
       ], {
         placeholder: "body",
         x: 0.5,
         y: 2.0,
         w: 9.0,
         h: 3.0,
         fontSize: 20,
         color: colors.text,
         fontFace: fonts?.body || "Calibri"
       });
       
       // Generate the template
       const pptxBase64 = await pres.write({ outputType: 'base64' });
       
       return c.json({
         success: true,
         message: "Master template created successfully",
         data: {
           template: pptxBase64,
           format: "pptx",
           filename: `${title}_Template.pptx`,
           masterName: title
         }
       });
       
     } catch (error) {
       return c.json({
         success: false,
         message: `Failed to create master template: ${error.message}`,
         error: error.message
       }, 500);
     }
   })
})