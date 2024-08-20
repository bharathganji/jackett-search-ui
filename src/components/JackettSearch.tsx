import { useEffect, useRef, useState } from "react";
import { Input, Button, Progress, Chip } from "@nextui-org/react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-material.css";
import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";

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
        // `http://localhost:8000/search?query=${inputRef.current?.value || ""}`
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
    }, 1000);
  };

  const indexerNames = Array.from(
    new Set(results.map((result) => result.IndexerId))
  );

  // Helper function to convert size to GB
  const convertSizeToGB = (size: number): string => {
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
      width: 500,
    },

    {
      headerName: "Seeders",
      field: "Seeders",
      sortable: true,
      resizable: true,
      sort: "desc",
      width: 100,
    },

    {
      headerName: "Size",
      field: "Size",
      sortable: true,
      resizable: true,
      width: 100,

      cellRenderer: (params: { value: number }) =>
        convertSizeToGB(params.value),
    },
    {
      headerName: "Actions",
      cellRenderer: (params: { data: JackettSearchResult }) => (
        <div>
          {
            <Button
              color={
                copiedItem?.type === "magnet" &&
                copiedItem.id === params.data.Link
                  ? "success"
                  : "secondary"
              }
              onPress={() =>
                handleCopy(
                  "magnet",
                  params.data.Link || `magnet:?xt=urn:btih:${params.data.InfoHash}`,
                  params.data.Link || params.data.InfoHash
                )
              }
            >
              {params.data.Link ? "Copy 🧲" : "Copy InfoHash"}
            </Button>
          }
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
            onPress={() =>
              handleCopy("source", params.data.Details, params.data.Details)
            }
          >
            Copy Source
          </Button>
        </>
      ),
    },
    {
      headerName: "IndexerId",
      field: "IndexerId",
      sortable: true,
      resizable: true,
    },
    {
      headerName: "Year",
      field: "Year",
      sortable: true,
      resizable: true,
      width: 100,
    },
  ];

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
        <h1>
          <p className="text-2xl font-bold">
            Jackett Search ({results.length} Results)
          </p>
        </h1>
        <div className="flex mb-4">
          <div className="flex mb-4 mt-4 w-full">
            <Input
              ref={inputRef}
              className="flex-grow mr-2"
              placeholder="Search query"
              isDisabled={loading}
            />
            <Button
              color="primary"
              variant="shadow"
              isDisabled={loading}
              onPress={fetchDataJackett}
            >
              Search
            </Button>
          </div>
        </div>
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
      <div
        className="ag-theme-material-auto-dark mx-auto p-4"
        style={{ height: 500, width: "100%" }}
      >
        {error && (
          <p color="error" className="text-center">
            {error}
          </p>
        )}
        {results.length > 0 && (
          <AgGridReact
            columnDefs={columnDefs}
            rowData={results}
            defaultColDef={{ sortable: true, resizable: true }}
            enableCellTextSelection={true}
          />
        )}
      </div>
    </>
  );
};

export default JackettSearch;
