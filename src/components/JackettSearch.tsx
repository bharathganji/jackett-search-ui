import { useEffect, useMemo, useRef, useState } from "react";
import { Input, Button, Progress, Chip, Avatar } from "@nextui-org/react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-material.css";
import { ColDef, GridOptions } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import GitHubButton from "react-github-btn";
import HitsBadge from "./HitsBadge";
import jackettLogo from "../assets/jackett-icon.png";

// Define the interface for Jackett search results
interface JackettSearchResult {
  Title: string;
  Link: string;
  InfoHash: string;
  Seeders: number;
  Leechers: number;
  Size: string;
  IndexerId: string;
  Year: number;
  Details: string;
}

// JackettSearch component for searching and displaying results
const JackettSearch = () => {
  const [results, setResults] = useState<JackettSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to store the EventSource instance
  const eventSourceRef = useRef<EventSource | null>(null);
  // Ref for the input element
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Function to fetch data from Jackett
  const fetchDataJackett = async () => {
    setLoading(true);
    setError(null);
    setResults([]);

    // Close existing EventSource connection if it exists
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      // Create a new EventSource instance for the query
      const eventSource = new EventSource(
        `${import.meta.env.VITE_JACKETT_API_URL}/search?query=${
          inputRef.current?.value || ""
        }`
      );

      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const parsedResult: JackettSearchResult = JSON.parse(event.data);
          setResults((prevResults) => [...prevResults, parsedResult]);
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setLoading(false);
      };

      eventSource.onopen = () => {
        setLoading(true);
        console.log("EventSource connection opened");
      };
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error fetching data");
    } finally {
      setLoading(false);
    }
  };

  const [copiedItem, setCopiedItem] = useState<{
    type: "magnet" | "source";
    id: string;
  } | null>(null);

  // Handle copy to clipboard
  const handleCopy = (
    type: "magnet" | "source",
    content: string,
    id: string
  ) => {
    navigator.clipboard.writeText(content);
    setCopiedItem({ type, id });
    setTimeout(() => {
      setCopiedItem(null);
    }, 200);
  };

  const renderMagetButton = (Link: string) => {
    if (Link?.startsWith("magnet:")) {
      return "Copy 🧲";
    } else {
      return "Open";
    }
  };

  // Optimized function to get unique indexer names from the results
  const indexerNames = useMemo(() => {
    const names = new Set<string>();
    for (const result of results) {
      names.add(result.IndexerId);
    }
    return Array.from(names);
  }, [results]);

  // Helper function to convert size to GB
  const convertSizeToGB = (size: number): string => {
    if (!size) return "N/A";
    const sizeInBytes = parseFloat(size.toString());
    const sizeInGB = sizeInBytes / (1024 * 1024 * 1024);
    return `${sizeInGB.toFixed(2)} GB`;
  };

  const columnDefs: ColDef<JackettSearchResult>[] = [
    {
      headerName: "Title",
      field: "Title",
      sortable: true,
      resizable: true,
      filter: "agTextColumnFilter",
    },
    {
      headerName: "Seeders",
      field: "Seeders",
      sortable: true,
      resizable: true,
      sort: "desc",
    },

    {
      headerName: "Size",
      field: "Size",
      sortable: true,
      resizable: true,
      cellRenderer: (params: { value: number }) =>
        convertSizeToGB(params.value),
    },
    {
      headerName: "Actions",
      cellRenderer: (params: { data: JackettSearchResult }) => (
        <div>
          <Button
            color={
              copiedItem?.type === "magnet" &&
              copiedItem.id === params.data.Link
                ? "success"
                : "secondary"
            }
            onPress={() => {
              if (params.data.Link?.startsWith("magnet:")) {
                handleCopy("magnet", params.data.Link, params.data.Link);
              } else {
                handleCopy("magnet", params.data.Link, params.data.Link);
                window.open(params.data.Link, "_blank"); // Open in new tab
              }
            }}
          >
            {renderMagetButton(params.data.Link)}
          </Button>
        </div>
      ),
    },
    {
      headerName: "website",
      field: "Details",
      sortable: true,
      resizable: true,
      cellRenderer: (params: { data: JackettSearchResult }) => (
        <>
          <Button
            color={
              copiedItem?.type === "source" &&
              copiedItem.id === params.data.Details
                ? "success"
                : "secondary"
            }
            onPress={() => {
              handleCopy("source", params.data.Details, params.data.Details);
              window.open(params.data.Details, "_blank"); // Open in new tab
            }}
          >
            open Source
          </Button>
        </>
      ),
    },
    {
      headerName: "IndexerId",
      field: "IndexerId",
      sortable: true,
      resizable: true,
      filter: "agTextColumnFilter",
    },

  ];

  const gridOptions: GridOptions = {
    rowHeight: 45,
    autoSizeStrategy: {
      type: "fitCellContents",
    },
  };

  useEffect(() => {
    let batch: JackettSearchResult[] = [];
    const interval = setInterval(() => {
      if (batch.length > 0) {
        setResults((prevResults) => [...prevResults, ...batch]);
        batch = [];
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Cleanup the EventSource connection when the component unmounts
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Focus the input field when the component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <>
      {loading && (
        <Progress
          size="sm"
          isIndeterminate
          aria-label="Loading"
          className="w-full"
        />
      )}
      <div className="flex flex-col w-full gap-4 p-4">
        <div className="flex gap-2 items-center">
          <Avatar src={jackettLogo} size="lg" className="w-8 h-8" alt="jackett logo" />
          <h1>
            Jackett Search ({results.length} Results)
          </h1>
          <GitHubButton
            href="https://github.com/bharathganji/jackett-search-ui"
            data-color-scheme="no-preference: light; light: light; dark: dark;"
            data-icon="octicon-star"
            data-size="small"
            data-show-count="true"
            aria-label="Star bharathganji/pikpak-plus on GitHub"
          >
            Star
          </GitHubButton>
        </div>

        <div className="flex mb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchDataJackett();
            }}
            className="w-full"
          >
            <div className="flex mb-4 mt-4">
              <Input
                ref={inputRef}
                className="flex-grow mr-2"
                placeholder="Search query"
                isDisabled={loading}
              />
              <Button
                color="primary"
                variant="solid"
                isDisabled={loading}
                isLoading={loading}
                type="submit"
              >
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>
      <div>{error && <p className="text-center text-red-500">{error}</p>}</div>

      <div
        className="ag-theme-material-auto-dark mx-auto p-4 w-full"
        style={{ height: 500 }}
      >
        {results.length > 0 && (
          <AgGridReact
            columnDefs={columnDefs}
            gridOptions={gridOptions}
            rowData={results}
            enableCellTextSelection={true}
            suppressDragLeaveHidesColumns={true}
            suppressMovableColumns={true}
          />
        )}
      </div>
      <div className="flex flex-wrap gap-2 p-3">
        {indexerNames.map((indexer, index) => (
          <Chip key={index} color="primary" variant="shadow">
            {`${indexer} (${
              results.filter((result) => result.IndexerId === indexer).length
            })`}
          </Chip>
        ))}
      </div>
      <div className="flex justify-center">
        <HitsBadge />
      </div>
    </>
  );
};

export default JackettSearch;
