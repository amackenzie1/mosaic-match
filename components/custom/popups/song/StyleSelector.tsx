import { Box, Chip, Paper, TextField, Typography } from "@mui/material";
import { styled } from "@mui/system";
import React, { useEffect, useRef, useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "react-beautiful-dnd";

interface StyleSelectorProps {
  onCategoryChange: (category: string) => void;
  onStylesChange: (styles: string[]) => void;
  onInspirationChange: (inspiration: string) => void;
  initialCategory: string;
  initialStyles: string[];
  initialInspiration: string;
}

const categories = [
  "Romance",
  "Friendship",
  "Family",
  "Work",
  "Adventure",
  "Custom",
];
const allStyles = [
  "Pop",
  "Rock",
  "Hip Hop",
  "Jazz",
  "Classical",
  "Electronic",
  "R&B",
  "Country",
  "Indie",
  "Folk",
  "Reggae",
  "Blues",
  "Soul",
  "Funk",
  "Disco",
  "Techno",
  "House",

  "Ambient",
  "Metal",
  "Punk",
  "Grunge",
  "Alternative",
  "Experimental",
  "Drill",
  "Japanese Rap",
  "Russian Folk",
  "Custom",
];

const SectionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(3),
}));

const ColumnContainer = styled(Paper)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  minHeight: 150,
  display: "flex",
  flexDirection: "column",
}));

const ChipsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
  flex: 1,
}));

const StyleSelector: React.FC<StyleSelectorProps> = ({
  onCategoryChange,
  onStylesChange,
  onInspirationChange,
  initialCategory,
  initialStyles,
  initialInspiration,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);
  const [availableCategories, setAvailableCategories] = useState<string[]>(
    categories.filter((cat) => cat !== initialCategory)
  );
  const [selectedStyles, setSelectedStyles] = useState<string[]>(initialStyles);
  const [availableStyles, setAvailableStyles] = useState<string[]>(
    allStyles.filter((style) => !initialStyles.includes(style))
  );
  const [inspiration, setInspiration] = useState<string>(initialInspiration);
  const [editingItem, setEditingItem] = useState<{
    section: string;
    index: number;
  } | null>(null);
  const [customValue, setCustomValue] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);
  const [customInput, setCustomInput] = useState<{
    type: string;
    value: string;
  } | null>(null);

  useEffect(() => {
    if (editingItem) {
      customInputRef.current?.focus();
    }
  }, [editingItem]);

  useEffect(() => {
    setSelectedCategory(initialCategory);
    setAvailableCategories(categories.filter((cat) => cat !== initialCategory));
    setSelectedStyles(initialStyles);
    setAvailableStyles(
      allStyles.filter((style) => !initialStyles.includes(style))
    );
    setInspiration(initialInspiration);
  }, [initialCategory, initialStyles, initialInspiration]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === "category" &&
      destination.droppableId === "selectedCategory"
    ) {
      const newCategory = availableCategories[source.index];
      if (newCategory === "Custom") {
        setCustomInput({ type: "category", value: "" });
      } else {
        setSelectedCategory(newCategory);
        setAvailableCategories((prev) => [
          ...prev.filter((cat) => cat !== newCategory),
          selectedCategory,
        ]);
        onCategoryChange(newCategory);
      }
    } else if (
      source.droppableId === "selectedCategory" &&
      destination.droppableId === "category"
    ) {
      const oldCategory = selectedCategory;
      setSelectedCategory("");
      setAvailableCategories((prev) => [...prev, oldCategory]);
      onCategoryChange("");
    } else if (
      source.droppableId === "style" &&
      destination.droppableId === "selectedStyle"
    ) {
      const newStyle = availableStyles[source.index];
      if (newStyle === "Custom") {
        setCustomInput({ type: "style", value: "" });
      } else {
        setSelectedStyles((prev) => [...prev, newStyle]);
        setAvailableStyles((prev) =>
          prev.filter((style) => style !== newStyle)
        );
        onStylesChange([...selectedStyles, newStyle]);
      }
    } else if (
      source.droppableId === "selectedStyle" &&
      destination.droppableId === "style"
    ) {
      const oldStyle = selectedStyles[source.index];
      setSelectedStyles((prev) => prev.filter((style) => style !== oldStyle));
      setAvailableStyles((prev) => [...prev, oldStyle]);
      onStylesChange(selectedStyles.filter((style) => style !== oldStyle));
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomInput((prev) =>
      prev ? { ...prev, value: e.target.value } : null
    );
  };

  const handleCustomInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomInputBlur();
    }
  };

  const handleCustomInputBlur = () => {
    if (customInput && customInput.value.trim()) {
      if (customInput.type === "category") {
        setSelectedCategory(customInput.value);
        onCategoryChange(customInput.value);
      } else if (customInput.type === "style") {
        setSelectedStyles((prev) => [...prev, customInput.value]);
        onStylesChange([...selectedStyles, customInput.value]);
      }
    }
    setCustomInput(null);
  };

  const handleEditItem = (section: string, index: number, newValue: string) => {
    if (section === "category") {
      setSelectedCategory(newValue);
      onCategoryChange(newValue);
    } else if (section === "style") {
      const newStyles = [...selectedStyles];
      newStyles[index] = newValue;
      setSelectedStyles(newStyles);
      onStylesChange(newStyles);
    }
    setEditingItem(null);
    setCustomValue("");
  };

  const handleDeleteItem = (section: string, index: number) => {
    if (section === "style") {
      const newStyles = selectedStyles.filter((_, i) => i !== index);
      setSelectedStyles(newStyles);
      onStylesChange(newStyles);
    }
  };

  const renderSection = (
    title: string,
    items: string[],
    selected: string | string[],
    droppableId: string,
    selectedDroppableId: string
  ) => (
    <SectionContainer>
      <ColumnContainer elevation={3}>
        <Typography variant="subtitle2" gutterBottom>
          Available {title}
        </Typography>
        <Droppable droppableId={droppableId}>
          {(provided) => (
            <ChipsContainer
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {(title === "Category"
                ? availableCategories
                : availableStyles
              ).map((item, index) => (
                <Draggable
                  key={`${droppableId}-${item}-${index}`}
                  draggableId={`${droppableId}-${item}-${index}`}
                  index={index}
                >
                  {(provided) => (
                    <Chip
                      label={item}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ChipsContainer>
          )}
        </Droppable>
      </ColumnContainer>
      <ColumnContainer elevation={3}>
        <Typography variant="subtitle2" gutterBottom>
          Selected {title}
        </Typography>
        <Droppable droppableId={selectedDroppableId}>
          {(provided) => (
            <ChipsContainer
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {Array.isArray(selected) ? (
                selected.map((item, index) => (
                  <Draggable
                    key={`${selectedDroppableId}-${item}-${index}`}
                    draggableId={`${selectedDroppableId}-${item}-${index}`}
                    index={index}
                  >
                    {(provided) => (
                      <Chip
                        label={item}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onDelete={() =>
                          handleDeleteItem(title.toLowerCase(), index)
                        }
                      />
                    )}
                  </Draggable>
                ))
              ) : (
                <Draggable
                  key={`${selectedDroppableId}-${selected}`}
                  draggableId={`${selectedDroppableId}-${selected}`}
                  index={0}
                >
                  {(provided) => (
                    <Chip
                      label={selected}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    />
                  )}
                </Draggable>
              )}
              {customInput &&
                customInput.type.toLowerCase() === title.toLowerCase() && (
                  <TextField
                    value={customInput.value}
                    onChange={handleCustomInputChange}
                    onBlur={handleCustomInputBlur}
                    onKeyDown={handleCustomInputKeyDown}
                    autoFocus
                    placeholder={`Enter custom ${title.toLowerCase()}`}
                    size="small"
                  />
                )}
              {provided.placeholder}
            </ChipsContainer>
          )}
        </Droppable>
      </ColumnContainer>
    </SectionContainer>
  );

  return (
    <Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ width: "100%", mt: 2 }}>
          {renderSection(
            "Category",
            categories,
            selectedCategory,
            "category",
            "selectedCategory"
          )}
          {renderSection(
            "Style",
            allStyles,
            selectedStyles,
            "style",
            "selectedStyle"
          )}
        </Box>
      </DragDropContext>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Inspiration
        </Typography>
        <TextField
          fullWidth
          value={inspiration}
          onChange={(e) => {
            setInspiration(e.target.value);
            onInspirationChange(e.target.value);
          }}
          placeholder="Example: ra ra rasputin with english and japanese lyrics"
        />
      </Box>
    </Box>
  );
};

export default StyleSelector;
