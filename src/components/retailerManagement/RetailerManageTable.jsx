import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Space,
  Switch,
  Dropdown,
  Menu,
  message,
  Spin,
  Tag,
} from "antd";
import {
  EditOutlined,
  EyeOutlined,
  DownOutlined,
  PlusOutlined,
  LoadingOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import VideoFormModal from "./VideoFormModal";
import VideoDetailsModal from "./VideoDetailsModal";
import GradientButton from "../common/GradiantButton";
import {
  useGetAllVideosQuery,
  useDeleteVideoMutation,
  useUpdateVideoMutation,
  useUpdateVideoStatusMutation,
  useGetVideoByIdQuery,
} from "../../redux/apiSlices/videoApi";
import { getVideoAndThumbnail } from "../common/imageUrl";
import { useGetCategoryQuery } from "../../redux/apiSlices/categoryApi";
import moment from "moment/moment";
import { Filtering } from "../common/Svg";
import Spinner from "../common/Spinner";

const VideoManagementSystem = () => {
  // State for modals and editing
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [equipmentTags, setEquipmentTags] = useState([]);
  const [selectedVideoId, setSelectedVideoId] = useState(null);

  // State for filtering and pagination - FIXED: Removed duplicate pagination state
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");

  // FIXED: Removed selectedCategoryId state as it's redundant

  // FIXED: Proper query params construction
  const queryParams = React.useMemo(() => {
    const params = [];

    if (searchText) {
      params.push({ name: "searchTerm", value: searchText });
    }

    if (statusFilter && statusFilter !== "all") {
      params.push({ name: "status", value: statusFilter });
    }

    if (categoryFilter && categoryFilter !== "all") {
      params.push({ name: "category", value: categoryFilter });
    }

    // Add pagination params
    params.push({ name: "page", value: currentPage });
    params.push({ name: "limit", value: pageSize });

    return params;
  }, [searchText, statusFilter, categoryFilter, currentPage, pageSize]);

  // Only fetch video details when we have a selectedVideoId for details view
  const { data: videoDetails } = useGetVideoByIdQuery(selectedVideoId, {
    skip: !selectedVideoId,
  });

  // API hooks
  const { data: categoryData } = useGetCategoryQuery();
  const categories = categoryData?.data || [];

  // FIXED: Get all videos with proper query params
  const {
    data: videosData,
    isLoading: isLoadingVideos,
    refetch,
  } = useGetAllVideosQuery(queryParams.length > 0 ? queryParams : []);
  console.log(videosData)

  const videos = videosData?.data || [];
  const paginationData = videosData?.pagination || {
    total: 0,
    current: 1,
    pageSize: 5,
  };

  const [deleteVideo] = useDeleteVideoMutation();
  const [updateVideoStatus] = useUpdateVideoStatusMutation();

  // Update currentVideo when videoDetails is fetched
  useEffect(() => {
    if (videoDetails && selectedVideoId) {
      setCurrentVideo({
        ...videoDetails,
        id: videoDetails._id || videoDetails.id,
      });

      if (isFormModalVisible && editingId) {
        setEquipmentTags(videoDetails.equipment || []);
      }
    }
  }, [videoDetails, selectedVideoId, isFormModalVisible, editingId]);

  // FIXED: Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, searchText]);

  const showFormModal = useCallback((record = null) => {
    if (record) {
      setEditingId(record._id);
      setSelectedVideoId(record._id);
      setCurrentVideo({
        ...record,
        id: record._id,
      });
      setEquipmentTags(record.equipment || []);
    } else {
      setEditingId(null);
      setCurrentVideo(null);
      setEquipmentTags([]);
      setSelectedVideoId(null);
    }
    setIsFormModalVisible(true);
  }, []);

  // Show details modal
  const showDetailsModal = useCallback((record) => {
    setCurrentVideo(record);
    setIsDetailsModalVisible(true);
  }, []);

  // Handle form submission
  const handleFormSubmit = useCallback(async () => {
    try {
      setIsFormModalVisible(false);
      setEditingId(null);
      setCurrentVideo(null);
      setEquipmentTags([]);
      setSelectedVideoId(null);
      await refetch();
    } catch (error) {
      console.error("Error in form submit:", error);
    }
  }, [refetch]);

  // Handle video deletion
  const handleDeleteVideo = useCallback(
    (id) => {
      Modal.confirm({
        title: "Are you sure you want to delete this video?",
        content: "This action cannot be undone.",
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk: async () => {
          try {
            await deleteVideo(id).unwrap();
            message.success("Video deleted successfully");
            refetch();
          } catch (error) {
            message.error("Failed to delete video");
            console.error("Error deleting video:", error);
          }
        },
      });
    },
    [deleteVideo, refetch]
  );

  // Handle status change
  const handleStatusChange = useCallback(
    (checked, record) => {
      const newStatus = checked ? "active" : "inactive";

      Modal.confirm({
        title: `Are you sure you want to set the status to "${newStatus}"?`,
        okText: "Yes",
        cancelText: "No",
        okButtonProps: {
          style: {
            backgroundColor: "red",
            borderColor: "red",
          },
        },
        onOk: async () => {
          try {
            await updateVideoStatus({
              id: record._id,
              ...record,
              status: newStatus,
            }).unwrap();
            message.success(`Video status updated to ${newStatus}`);
            refetch();
          } catch (error) {
            message.error("Failed to update video status");
            console.error("Error updating video status:", error);
          }
        },
      });
    },
    [updateVideoStatus, refetch]
  );

  // FIXED: Handle table pagination change
  const handleTableChange = useCallback((paginationConfig) => {
    setCurrentPage(paginationConfig.current);
    setPageSize(paginationConfig.pageSize);
  }, []);

  // Handle modal close
  const handleDetailsModalClose = useCallback(() => {
    setIsDetailsModalVisible(false);
    setSelectedVideoId(null);
  }, []);

  const handleFormModalClose = useCallback(() => {
    setIsFormModalVisible(false);
    setEditingId(null);
    setCurrentVideo(null);
    setEquipmentTags([]);
    setSelectedVideoId(null);
  }, []);


  const handleCategoryFilterChange = useCallback((category) => {
    setCategoryFilter(category.toLowerCase());
  }, []);

  const handleStatusFilterChange = useCallback((status) => {
    setStatusFilter(status.toLowerCase());
  }, []);

  // FIXED: Filter menus with proper key handling
  const filterMenu = React.useMemo(
    () => (
      <Menu>
        <Menu.Item key="all" onClick={() => handleCategoryFilterChange("all")}>
          All Categories
        </Menu.Item>
        {categories?.map((cat) => (
          <Menu.Item
            key={cat._id}
            onClick={() => handleCategoryFilterChange(cat.name)}
          >
            {cat.name}
          </Menu.Item>
        ))}
      </Menu>
    ),
    [categories, handleCategoryFilterChange]
  );

  const statusMenu = React.useMemo(
    () => (
      <Menu>
        <Menu.Item key="all" onClick={() => handleStatusFilterChange("all")}>
          All Status
        </Menu.Item>
        <Menu.Item
          key="active"
          onClick={() => handleStatusFilterChange("active")}
        >
          Active
        </Menu.Item>
        <Menu.Item
          key="inactive"
          onClick={() => handleStatusFilterChange("inactive")}
        >
          Inactive
        </Menu.Item>
      </Menu>
    ),
    [handleStatusFilterChange]
  );

  // FIXED: Table columns with proper pagination calculation
  const columns = React.useMemo(
    () => [
      {
        title: "SL",
        key: "id",
        width: 70,
        align: "center",
        render: (text, record, index) => {
          const actualIndex = (currentPage - 1) * pageSize + index + 1;
          return `# ${actualIndex}`;
        },
      },
      {
        title: "Video Title",
        dataIndex: "title",
        key: "title",
        align: "center",
      },
      {
        title: "Thumbnail",
        dataIndex: "thumbnailUrl",
        key: "thumbnailUrl",
        align: "center",
        render: (_, record) => {
          return (
            <div style={{ display: "flex", justifyContent: "center" }}>
              {isLoadingVideos ? (
                <Spin size="small" />
              ) : (
                <img
                  src={getVideoAndThumbnail(record.thumbnailUrl)}
                  alt="thumbnail"
                  style={{
                    width: 100,
                    height: 50,
                    objectFit: "cover",
                    visibility: isLoadingVideos ? "hidden" : "visible",
                  }}
                  className="rounded-lg"
                />
              )}
            </div>
          );
        },
      },
      {
        title: "Category",
        dataIndex: "category",
        key: "category",
        align: "center",
      },
      {
        title: "Sub Category",
        dataIndex: "subCategory",
        key: "subCategory",
        align: "center",
      },
      {
        title: "Upload Date",
        dataIndex: "createdAt",
        key: "createdAt",
        align: "center",
        render: (text) => {
          return moment(text).format("L");
        },
      },
      {
        title: "Duration",
        dataIndex: "duration",
        key: "duration",
        align: "center",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        align: "center",
        render: (status) => (
          <Tag color={status === "active" ? "success" : "error"}>
            {status === "active" ? "Active" : "Inactive"}
          </Tag>
        ),
      },
      {
        title: "Action",
        key: "action",
        align: "center",
        render: (_, record) => (
          <Space
            size="small"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Button
              type="text"
              icon={<EditOutlined style={{ color: "#f55" }} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                showFormModal(record);
              }}
            />
            <Button
              type="text"
              icon={<EyeOutlined style={{ color: "#55f" }} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                showDetailsModal(record);
              }}
            />
            <Switch
              size="small"
              checked={record.status === "active"}
              onChange={(checked, e) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
                handleStatusChange(checked, record);
              }}
              onClick={(checked, e) => {
                if (e) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              style={{
                backgroundColor: record.status === "active" ? "red" : "gray",
              }}
            />
            <Button
              type="text"
              icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteVideo(record._id);
              }}
            />
          </Space>
        ),
      },
    ],
    [
      currentPage,
      pageSize,
      isLoadingVideos,
      showFormModal,
      showDetailsModal,
      handleStatusChange,
      handleDeleteVideo,
    ]
  );

  // Get display text for filters
  const getCategoryDisplayText = () => {
    if (categoryFilter === "all") return "All Categories";
    const category = categories.find(
      (cat) => cat.name.toLowerCase() === categoryFilter
    );
    return category ? category.name : "All Categories";
  };

  const getStatusDisplayText = () => {
    if (statusFilter === "all") return "All Status";
    return statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);
  };

  if (isLoadingVideos) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end gap-6 mb-6">
        <div className="">
          <Space size="small" className="flex gap-4">
            <Dropdown
              overlay={filterMenu}
              trigger={["click"]}
              placement="bottomLeft"
            >
              <Button
                className="py-5 mr-2 text-white bg-red-600 hover:bg-red-800 hover:text-white hover:icon-black"
                style={{ border: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Space>
                  <Filtering className="filtering-icon" />
                  <span className="filter-text">
                    {getCategoryDisplayText()}
                  </span>
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>

            <Dropdown
              overlay={statusMenu}
              trigger={["click"]}
              placement="bottomLeft"
            >
              <Button
                className="py-5 mr-2 text-white bg-red-600 hover:bg-red-800 hover:text-white hover:icon-black"
                style={{ border: "none" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Space>
                  <Filtering className="filtering-icon" />
                  <span className="filter-text">{getStatusDisplayText()}</span>
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          </Space>
        </div>
        <GradientButton
          type="primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showFormModal();
          }}
          className="py-5"
          icon={<PlusOutlined />}
        >
          Upload New Video
        </GradientButton>
      </div>

      <Table
        columns={columns}
        dataSource={videos}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: paginationData.total || 0,
        }}
        onChange={handleTableChange}
        rowKey="_id"
        bordered
        size="small"
        className="custom-table"
        scroll={{ x: "max-content" }}
        onRow={(record) => ({
          onClick: (e) => {
            e.stopPropagation();
          },
        })}
      />

      {/* Add/Edit Video Modal */}
      <VideoFormModal
        visible={isFormModalVisible}
        onCancel={handleFormModalClose}
        onSuccess={handleFormSubmit}
        currentVideo={currentVideo}
        editingId={editingId}
        categories={categories}
        equipmentTags={equipmentTags}
        setEquipmentTags={setEquipmentTags}
      />

      {/* Video Details Modal */}
      <VideoDetailsModal
        visible={isDetailsModalVisible}
        onCancel={handleDetailsModalClose}
        currentVideo={currentVideo}
      />
    </div>
  );
};

export default VideoManagementSystem;
